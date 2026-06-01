/**
 * ARKON Institution Admin Routes — TASK-TENANT-002
 * F-010: Multi-tenant admin panel per institusi
 * Role: admin_institusi
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { resolveInstitution } = require('../middleware/multiTenant');

// All routes require institution admin role
router.use(authenticateToken, resolveInstitution);

// ─── GET: Institution overview stats ──────────────────────────────────────
router.get('/stats', requireRole(['admin_institusi', 'superadmin']), async (req, res) => {
  try {
    const instId = req.institutionId;
    if (!instId) return res.status(403).json({ error: 'Tidak terhubung ke institusi.' });

    const [usersRes, roomsRes, activeUsersRes] = await Promise.all([
      pool.query('SELECT role, COUNT(*)::int FROM users WHERE institution_id = $1 GROUP BY role', [instId]),
      pool.query('SELECT status, COUNT(*)::int FROM rooms WHERE institution_id = $1 GROUP BY status', [instId]),
      pool.query(`SELECT COUNT(DISTINCT student_id)::int as count FROM analytics
                  WHERE room_id IN (SELECT id FROM rooms WHERE institution_id = $1)
                  AND created_at > NOW() - INTERVAL '30 days'`, [instId])
    ]);

    const userStats = {};
    usersRes.rows.forEach(r => { userStats[r.role] = r.count; });

    const roomStats = {};
    roomsRes.rows.forEach(r => { roomStats[r.status || 'active'] = r.count; });

    res.json({
      users: userStats,
      rooms: roomStats,
      active_users_30d: activeUsersRes.rows[0]?.count || 0,
      institution_id: instId
    });
  } catch (err) {
    console.error('[Admin] Stats error:', err);
    res.status(500).json({ error: 'Gagal mengambil statistik.' });
  }
});

// ─── GET: List all users in institution ───────────────────────────────────
router.get('/users', requireRole(['admin_institusi', 'superadmin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const instId = req.institutionId;

    let where = 'WHERE institution_id = $1';
    const params = [instId];
    let pIdx = 2;

    if (role) { where += ` AND role = $${pIdx++}`; params.push(role); }
    if (search) { where += ` AND (full_name ILIKE $${pIdx} OR identifier_number ILIKE $${pIdx})`; params.push(`%${search}%`); pIdx++; }

    const [usersRes, countRes] = await Promise.all([
      pool.query(`SELECT id, full_name, identifier_number, email, role, coins, theta, is_verified, created_at
                  FROM users ${where} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx+1}`,
        [...params, parseInt(limit), offset]),
      pool.query(`SELECT COUNT(*)::int FROM users ${where}`, params)
    ]);

    res.json({
      users: usersRes.rows,
      total: countRes.rows[0].count,
      page: parseInt(page),
      totalPages: Math.ceil(countRes.rows[0].count / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar pengguna.' });
  }
});

// ─── GET: All rooms in institution ────────────────────────────────────────
router.get('/rooms', requireRole(['admin_institusi', 'superadmin']), async (req, res) => {
  try {
    const instId = req.institutionId;
    const result = await pool.query(
      `SELECT r.*, u.full_name as dosen_name,
        (SELECT COUNT(*)::int FROM class_members WHERE room_id = r.id) as member_count
       FROM rooms r LEFT JOIN users u ON r.dosen_id = u.id
       WHERE r.institution_id = $1 ORDER BY r.created_at DESC`,
      [instId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar room.' });
  }
});

// ─── POST: Generate institution invite code ────────────────────────────────
router.post('/invite-code', requireRole(['admin_institusi', 'superadmin']), async (req, res) => {
  try {
    const { role = 'mahasiswa', max_uses = 100, expires_days = 30 } = req.body;
    const instId = req.institutionId;

    const code = `${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expires_at = new Date(Date.now() + expires_days * 24 * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO institution_invite_codes (institution_id, code, role, max_uses, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [instId, code, role, max_uses, expires_at, req.user.id]
    );

    res.status(201).json({
      invite_code: result.rows[0],
      join_url: `${process.env.FRONTEND_URL || ''}/register?invite=${code}`
    });
  } catch (err) {
    console.error('[Admin] Invite code error:', err);
    res.status(500).json({ error: 'Gagal membuat kode undangan.' });
  }
});

// ─── GET: Institution aggregate N-Gain (for Kaprodi report) ──────────────
router.get('/ngain-aggregate', requireRole(['admin_institusi', 'superadmin']), async (req, res) => {
  try {
    const instId = req.institutionId;
    const result = await pool.query(
      `SELECT
        r.course_name,
        r.id as room_id,
        u.full_name as dosen_name,
        COUNT(DISTINCT cm.student_id)::int as student_count,
        AVG(sa.theta)::numeric(5,3) as avg_theta,
        MIN(a_pre.created_at)::date as pilot_start,
        MAX(a_post.created_at)::date as pilot_end
       FROM rooms r
       JOIN users u ON r.dosen_id = u.id
       LEFT JOIN class_members cm ON r.id = cm.room_id
       LEFT JOIN student_ability sa ON sa.room_id = r.id
       LEFT JOIN LATERAL (
         SELECT student_id, MIN(created_at) as created_at FROM analytics WHERE room_id = r.id GROUP BY student_id
       ) a_pre ON a_pre.student_id = cm.student_id
       LEFT JOIN LATERAL (
         SELECT student_id, MAX(created_at) as created_at FROM analytics WHERE room_id = r.id GROUP BY student_id
       ) a_post ON a_post.student_id = cm.student_id
       WHERE r.institution_id = $1
       GROUP BY r.id, r.course_name, u.full_name
       ORDER BY r.created_at DESC`,
      [instId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil N-Gain aggregate.' });
  }
});

// ─── PATCH: Update user role ──────────────────────────────────────────────
router.patch('/users/:userId/role', requireRole(['admin_institusi', 'superadmin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['mahasiswa', 'dosen'].includes(role)) {
      return res.status(400).json({ error: 'Role tidak valid. Pilih: mahasiswa atau dosen.' });
    }
    const instId = req.institutionId;

    // Verify user belongs to this institution
    const check = await pool.query('SELECT id FROM users WHERE id = $1 AND institution_id = $2', [req.params.userId, instId]);
    if (!check.rows.length) return res.status(404).json({ error: 'Pengguna tidak ditemukan di institusi ini.' });

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.userId]);
    res.json({ message: `Role berhasil diubah ke ${role}.` });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah role.' });
  }
});

module.exports = router;
