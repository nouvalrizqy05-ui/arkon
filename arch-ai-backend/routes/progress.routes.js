const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all progress for a student
router.get('/:student_id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT key, value FROM user_progress WHERE student_id = $1',
      [req.params.student_id]
    );
    // Kembalikan sebagai object { key: value, ... }
    const progressMap = {};
    result.rows.forEach(row => { progressMap[row.key] = row.value; });
    res.json(progressMap);
  } catch (err) {
    console.error('🔥 GET PROGRESS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil progress' });
  }
});

// Get specific progress key
router.get('/:student_id/:key', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT value FROM user_progress WHERE student_id = $1 AND key = $2',
      [req.params.student_id, req.params.key]
    );
    if (result.rows.length === 0) return res.json({ value: null });
    res.json({ value: result.rows[0].value });
  } catch (err) {
    console.error('🔥 GET PROGRESS KEY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil progress' });
  }
});

// Save/update progress (upsert)
router.post('/', authenticateToken, async (req, res) => {
  const { student_id, key, value } = req.body;
  if (!student_id || !key) return res.status(400).json({ error: 'student_id dan key wajib diisi' });

  try {
    // node-postgres mengkonversi Array javascript menjadi syntax array postgres `{"1"}` 
    // alih-alih valid JSON string `["1"]`. Maka kita harus melakukan stringify jika tipenya object/array.
    const jsonValue = typeof value === 'object' ? JSON.stringify(value) : value;

    const result = await pool.query(`
      INSERT INTO user_progress (student_id, key, value, updated_at)
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT (student_id, key) DO UPDATE 
      SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING *
    `, [student_id, key, jsonValue]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 SAVE PROGRESS ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan progress' });
  }
});

module.exports = router;
