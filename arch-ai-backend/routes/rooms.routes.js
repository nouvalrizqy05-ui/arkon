const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { resolveInstitution, buildInstitutionScope, assertSameInstitution } = require('../middleware/multiTenant');

// ─── CREATE ROOM (Dosen: classroom, Mahasiswa: personal/collaborative) ─────
router.post('/', authenticateToken, async (req, res) => {
  const owner_id = req.user.id;
  const { course_name, description, room_type, collab_mode } = req.body;
  const userRole = req.user.role;

  // Validate: only dosen can create 'classroom' type
  if (room_type === 'classroom' && userRole !== 'dosen') {
    return res.status(403).json({ error: 'Hanya dosen yang bisa membuat classroom.' });
  }

  // Generate room code
  const room_code = `ITDP-${Math.floor(1000 + Math.random() * 9000)}`;
  const institution_id = req.institutionId || null;
  
  // For collaborative rooms, also generate an invite code
  const invite_code = room_type === 'collaborative' 
    ? `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}` 
    : null;

  try {
    const result = await pool.query(
      `INSERT INTO rooms (dosen_id, owner_id, room_code, course_name, description, room_type, collab_mode, invite_code, institution_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        userRole === 'dosen' ? owner_id : null, // dosen_id only for classroom
        owner_id, // generic owner
        room_code,
        course_name,
        description || null,
        room_type || (userRole === 'dosen' ? 'classroom' : 'personal'),
        collab_mode || 'isolation',
        invite_code,
        req.institutionId || null // F-010: multi-tenant scoping
      ]
    );

    // Auto-join owner as member (for personal/collaborative rooms)
    if (room_type !== 'classroom') {
      await pool.query(
        'INSERT INTO class_members (room_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [result.rows[0].id, owner_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 ROOM CREATE ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat room' });
  }
});

// ─── GET ROOMS BY DOSEN ─────────────────────────────
router.get('/dosen/:dosen_id', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT id, room_code, course_name,
                COALESCE(room_type, 'classroom') as room_type,
                COALESCE(description, '') as description,
                COALESCE(is_live, false) as is_live,
                COALESCE(collab_mode, 'isolation') as collab_mode,
                COALESCE(status, 'active') as status,
                invite_code, created_at
         FROM rooms WHERE dosen_id = $1 AND (institution_id = $2 OR $2 IS NULL) ORDER BY created_at DESC`,
        [req.params.dosen_id, req.institutionId || null]
      );
    } catch {
      // Fallback: kolom tambahan belum ada
      result = await pool.query(
        `SELECT id, room_code, course_name,
                'classroom' as room_type, '' as description,
                false as is_live, 'isolation' as collab_mode,
                'active' as status,
                NULL as invite_code, created_at
         FROM rooms WHERE dosen_id = $1 AND (institution_id = $2 OR $2 IS NULL) ORDER BY created_at DESC`,
        [req.params.dosen_id, req.institutionId || null]
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET ROOMS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data room' });
  }
});

// ─── TOGGLE LIVE STATUS ─────────────────────────────
router.post('/:id/toggle-live', authenticateToken, requireRole('dosen'), async (req, res) => {
  const { is_live } = req.body;
  try {
    const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [req.params.id, req.user.id]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen kelas ini.' });
    const result = await pool.query('UPDATE rooms SET is_live = $1 WHERE id = $2 RETURNING *', [is_live, req.params.id]);
    if (global.io) {
      global.io.to(req.params.id).emit('room-live-status', { is_live });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 TOGGLE LIVE ERROR:', err);
    res.status(500).json({ error: 'Gagal mengubah status live' });
  }
});

// ─── JOIN ROOM ─────────────────────────────
router.post('/join', authenticateToken, async (req, res) => {
  const { room_code, student_id } = req.body;
  try {
    const roomResult = await pool.query('SELECT * FROM rooms WHERE room_code = $1', [room_code]);
    if (roomResult.rows.length === 0) return res.status(404).json({ error: 'ID Room tidak ditemukan!' });

    const room = roomResult.rows[0];
    const room_id = room.id;
    const memberCheck = await pool.query('SELECT * FROM class_members WHERE room_id = $1 AND student_id = $2', [room_id, student_id]);

    if (memberCheck.rows.length === 0) {
      await pool.query('INSERT INTO class_members (room_id, student_id) VALUES ($1, $2)', [room_id, student_id]);
    }
    res.status(200).json({ message: 'Berhasil bergabung', room, course_name: room.course_name });
  } catch (err) {
    console.error('🔥 JOIN ROOM ERROR:', err);
    res.status(500).json({ error: 'Gagal bergabung ke room' });
  }
});

// ─── LEAVE ROOM ─────────────────────────────
router.delete('/leave', authenticateToken, async (req, res) => {
  const { room_id, student_id } = req.body;
  try {
    await pool.query('DELETE FROM class_members WHERE room_id = $1 AND student_id = $2', [room_id, student_id]);
    res.status(200).json({ message: 'Berhasil keluar dari kelas' });
  } catch (err) {
    console.error('🔥 LEAVE ROOM ERROR:', err);
    res.status(500).json({ error: 'Gagal keluar dari kelas' });
  }
});

// ─── GET ROOMS BY STUDENT ─────────────────────────────
router.get('/student/:student_id', authenticateToken, async (req, res) => {
  try {
    // Gunakan COALESCE agar aman jika migration 001 belum dijalankan
    let result;
    try {
      const query = `
        SELECT r.id, r.room_code, r.course_name,
               COALESCE(r.room_type, 'classroom') as room_type,
               COALESCE(r.description, '') as description,
               COALESCE(r.is_live, false) as is_live,
               COALESCE(r.collab_mode, 'isolation') as collab_mode,
               COALESCE(r.status, 'active') as status,
               r.invite_code,
               cm.joined_at 
        FROM rooms r JOIN class_members cm ON r.id = cm.room_id
        WHERE cm.student_id = $1 ORDER BY cm.joined_at DESC`;
      result = await pool.query(query, [req.params.student_id]);
    } catch {
      // Fallback: query minimal tanpa kolom baru (sebelum migration 001)
      const fallbackQuery = `
        SELECT r.id, r.room_code, r.course_name,
               'classroom' as room_type, '' as description,
               false as is_live, 'isolation' as collab_mode,
               'active' as status,
               NULL as invite_code, cm.joined_at 
        FROM rooms r JOIN class_members cm ON r.id = cm.room_id
        WHERE cm.student_id = $1 ORDER BY cm.joined_at DESC`;
      result = await pool.query(fallbackQuery, [req.params.student_id]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET ROOM MHS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar kelas' });
  }
});

// ─── GET ROOM MEMBERS ─────────────────────────────
router.get('/:id/members', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.identifier_number as nim, u.avatar_id, u.frame_id, cm.joined_at
       FROM class_members cm
       JOIN users u ON cm.student_id = u.id
       WHERE cm.room_id = $1
       ORDER BY cm.joined_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET MEMBERS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar anggota' });
  }
});

// ─── GET ROOM DETAIL ─────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 GET ROOM ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data room' });
  }
});

// ─── UPDATE ROOM SETTINGS ─────────────────────────────
router.put('/:id/settings', authenticateToken, async (req, res) => {
  const { is_safe_mode, collab_mode, max_members, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE rooms SET 
        is_safe_mode = COALESCE($1, is_safe_mode),
        collab_mode = COALESCE($2, collab_mode),
        max_members = COALESCE($3, max_members),
        description = COALESCE($4, description)
       WHERE id = $5 RETURNING *`,
      [is_safe_mode, collab_mode, max_members, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Room tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 UPDATE SETTINGS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengupdate pengaturan' });
  }
});

// ─── ARCHIVE ROOM (TASK-FEAT-003) ─────────────────────────────
router.patch('/:id/archive', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [req.params.id, req.user.id]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen kelas ini.' });
    
    const result = await pool.query(
      `UPDATE rooms SET status = 'archived' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 ARCHIVE ROOM ERROR:', err);
    res.status(500).json({ error: 'Gagal mengarsipkan room' });
  }
});

// ─── DELETE ROOM ─────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check ownership: dosen via dosen_id, or owner via owner_id
    const roomCheck = await pool.query(
      'SELECT id FROM rooms WHERE id = $1 AND (dosen_id = $2 OR owner_id = $2)', 
      [req.params.id, req.user.id]
    );
    if (roomCheck.rows.length === 0) return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus kelas ini.' });

    await pool.query('DELETE FROM rooms WHERE id = $1', [req.params.id]);
    res.status(200).json({ message: 'Room berhasil dihapus' });
  } catch (err) {
    console.error('🔥 DELETE ROOM ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus room' });
  }
});

module.exports = router;
