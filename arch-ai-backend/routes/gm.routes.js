const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get students + coin balances in a room
router.get('/students/:roomId', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.identifier_number as nim, COALESCE(u.coins, 0) as coins
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      WHERE cm.room_id = $1
      ORDER BY u.full_name ASC
    `, [req.params.roomId]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GM STUDENTS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data mahasiswa' });
  }
});

// Give bonus coins
router.post('/bonus-coins', authenticateToken, requireRole('dosen'), async (req, res) => {
  const { student_id, amount, reason, room_id } = req.body;
  if (!student_id || !amount || !reason || !room_id) return res.status(400).json({ error: 'Data tidak lengkap' });
  if (amount > 1000) return res.status(400).json({ error: 'Maksimal 1000 koin per transaksi' });
  
  // Validate dosen owns the room
  try {
    const roomCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [room_id, req.user.id]);
    if (roomCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen kelas ini' });

    await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2', [amount, student_id]);
    await pool.query('INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)', [student_id, amount, `[GM Bonus] ${reason}`]);
    
    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [student_id]);
    console.log(`🎮 [GM] Bonus ${amount} coins to ${student_id}. Reason: ${reason}`);
    res.json({ message: `+${amount} koin bonus diberikan!`, coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 GM BONUS ERROR:', err);
    res.status(500).json({ error: 'Gagal memberi koin bonus' });
  }
});

// Get student builds in a room
router.get('/builds/:roomId', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pb.*, u.full_name as builder_name
      FROM pc_builds pb
      JOIN class_members cm ON pb.student_id = cm.student_id
      JOIN users u ON pb.student_id = u.id
      WHERE cm.room_id = $1
      ORDER BY pb.created_at DESC
    `, [req.params.roomId]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GM BUILDS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data builds' });
  }
});

// Activity feed for a room
router.get('/activity/:roomId', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ct.amount, ct.reason, ct.created_at, u.full_name as student_name
      FROM coin_transactions ct
      JOIN class_members cm ON ct.student_id = cm.student_id
      JOIN users u ON ct.student_id = u.id
      WHERE cm.room_id = $1
      ORDER BY ct.created_at DESC LIMIT 50
    `, [req.params.roomId]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GM ACTIVITY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil activity feed' });
  }
});

module.exports = router;
