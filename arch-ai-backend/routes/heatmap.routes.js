const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id as student_id, u.full_name as student_name,
        m.id as material_id, m.file_name as topic_raw,
        AVG(a.score)::int as avg_score,
        COUNT(a.id)::int as attempt_count
      FROM analytics a
      JOIN users u ON a.student_id = u.id
      JOIN materials m ON a.material_id = m.id
      WHERE a.room_id = $1 AND a.material_id IS NOT NULL
      GROUP BY u.id, u.full_name, m.id, m.file_name
      ORDER BY u.full_name, m.id
    `, [req.params.roomId]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 HEATMAP ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data heatmap' });
  }
});

module.exports = router;
