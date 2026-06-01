const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ─── CREATE ACTIVITY ─────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  const { room_id, created_by, title, description, activity_type, template_data, config, due_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO activities (room_id, created_by, title, description, activity_type, template_data, config, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [room_id, created_by, title, description || null, activity_type || 'free_build',
       JSON.stringify(template_data || {}), JSON.stringify(config || {}), due_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 CREATE ACTIVITY ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat aktivitas' });
  }
});

// ─── GET ACTIVITIES BY ROOM ─────────────────────────────
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE room_id = $1 ORDER BY created_at DESC',
      [req.params.roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET ACTIVITIES ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil aktivitas' });
  }
});

// ─── GET SINGLE ACTIVITY ─────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aktivitas tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 GET ACTIVITY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil aktivitas' });
  }
});

// ─── UPDATE ACTIVITY ─────────────────────────────
router.put('/:id', authenticateToken, async (req, res) => {
  const { title, description, activity_type, template_data, config, due_date, is_active } = req.body;
  try {
    const result = await pool.query(
      `UPDATE activities SET title = COALESCE($1, title), description = COALESCE($2, description),
       activity_type = COALESCE($3, activity_type), template_data = COALESCE($4, template_data),
       config = COALESCE($5, config), due_date = $6, is_active = COALESCE($7, is_active),
       updated_at = NOW() WHERE id = $8 RETURNING *`,
      [title, description, activity_type,
       template_data ? JSON.stringify(template_data) : null,
       config ? JSON.stringify(config) : null,
       due_date || null, is_active, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aktivitas tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 UPDATE ACTIVITY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengupdate aktivitas' });
  }
});

// ─── DELETE ACTIVITY ─────────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Aktivitas tidak ditemukan' });
    res.json({ message: 'Aktivitas berhasil dihapus' });
  } catch (err) {
    console.error('🔥 DELETE ACTIVITY ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus aktivitas' });
  }
});

module.exports = router;
