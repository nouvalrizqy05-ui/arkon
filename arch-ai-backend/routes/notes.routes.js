const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ─── ADD NOTE TO STUDENT WORK ─────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  const { work_id, author_id, author_name, author_role, content, note_type, position_data } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO project_notes (work_id, author_id, author_name, author_role, content, note_type, position_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [work_id, author_id, author_name || null, author_role, content,
       note_type || 'feedback', JSON.stringify(position_data || {})]
    );

    // Notify via Socket.io if available
    if (global.io) {
      // Get the student_id from the work
      const work = await pool.query('SELECT student_id, room_id FROM student_work WHERE id = $1', [work_id]);
      if (work.rows.length > 0) {
        global.io.to(work.rows[0].room_id).emit('note:new', {
          note: result.rows[0],
          student_id: work.rows[0].student_id,
          work_id
        });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 ADD NOTE ERROR:', err);
    res.status(500).json({ error: 'Gagal menambahkan catatan' });
  }
});

// ─── GET NOTES FOR A WORK ─────────────────────────────
router.get('/work/:workId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM project_notes WHERE work_id = $1 ORDER BY created_at DESC',
      [req.params.workId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET NOTES ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil catatan' });
  }
});

// ─── GET UNREAD NOTES COUNT FOR STUDENT ─────────────────────────────
router.get('/unread/:studentId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as unread_count FROM project_notes pn
       JOIN student_work sw ON pn.work_id = sw.id
       WHERE sw.student_id = $1 AND pn.is_read = false AND pn.author_role = 'dosen'`,
      [req.params.studentId]
    );
    res.json({ unread_count: parseInt(result.rows[0].unread_count) });
  } catch (err) {
    console.error('🔥 GET UNREAD NOTES ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil jumlah catatan' });
  }
});

// ─── MARK NOTES AS READ ─────────────────────────────
router.put('/read/:workId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE project_notes SET is_read = true WHERE work_id = $1 AND is_read = false',
      [req.params.workId]
    );
    res.json({ message: 'Catatan ditandai sudah dibaca' });
  } catch (err) {
    console.error('🔥 MARK READ ERROR:', err);
    res.status(500).json({ error: 'Gagal menandai catatan' });
  }
});

// ─── DELETE NOTE ─────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM project_notes WHERE id = $1 AND author_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(403).json({ error: 'Tidak bisa menghapus catatan ini' });
    res.json({ message: 'Catatan dihapus' });
  } catch (err) {
    console.error('🔥 DELETE NOTE ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus catatan' });
  }
});

module.exports = router;
