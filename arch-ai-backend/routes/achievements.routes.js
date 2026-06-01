const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/:student_id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT badge_id, unlocked_at FROM achievements WHERE student_id = $1 ORDER BY unlocked_at DESC',
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET ACHIEVEMENTS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data achievement' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { student_id, badge_id } = req.body;
  if (!student_id || !badge_id) return res.status(400).json({ error: 'student_id dan badge_id wajib diisi.' });
  try {
    const result = await pool.query(
      `INSERT INTO achievements (student_id, badge_id) VALUES ($1, $2)
       ON CONFLICT (student_id, badge_id) DO NOTHING
       RETURNING *`,
      [student_id, badge_id]
    );
    if (result.rows.length === 0) {
      return res.status(200).json({ message: 'Badge sudah dimiliki.', already_owned: true });
    }
    res.status(201).json({ message: 'Badge unlocked!', badge: result.rows[0], already_owned: false });
  } catch (err) {
    console.error('🔥 UNLOCK BADGE ERROR:', err);
    res.status(500).json({ error: 'Gagal unlock badge' });
  }
});

router.get('/leaderboard/:room_id', authenticateToken, async (req, res) => {
  try {
    // ✅ PAGINATION: Parse page & limit
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT u.id) as total
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      WHERE cm.room_id = $1
    `, [req.params.room_id]);
    const totalItems = parseInt(countResult.rows[0].total) || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated leaderboard
    const query = `
      SELECT u.id, u.full_name, u.identifier_number as nim, COUNT(a.badge_id) as badge_count
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      LEFT JOIN achievements a ON a.student_id = u.id
      WHERE cm.room_id = $1
      GROUP BY u.id, u.full_name, u.identifier_number
      ORDER BY badge_count DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [req.params.room_id, limit, offset]);
    
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('🔥 LEADERBOARD ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil leaderboard' });
  }
});

module.exports = router;
