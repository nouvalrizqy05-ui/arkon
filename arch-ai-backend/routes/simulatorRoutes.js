const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/simulator/logs
// Mahasiswa menyimpan log simulasi
router.post('/logs', authenticateToken, async (req, res) => {
  const { student_id, program_name, status, cycle_count, memory_dump } = req.body;
  if (req.user.id !== student_id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cpu_simulator_logs (student_id, program_name, status, cycle_count, memory_dump) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, program_name, status, cycle_count, memory_dump]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving simulator log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/simulator/logs
// Dosen mendapatkan seluruh log simulasi (untuk dashboard admin)
router.get('/logs', authenticateToken, async (req, res) => {
  if (req.user.role !== 'dosen') {
    return res.status(403).json({ error: 'Forbidden. Only Dosen can view logs.' });
  }

  const { limit = 20, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      `SELECT l.*, u.full_name as student_name 
       FROM cpu_simulator_logs l
       JOIN users u ON l.student_id = u.id
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching simulator logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
