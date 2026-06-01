const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.get('/me', authenticateToken, async (req, res) => {
  try {
    let result;
    try {
      // Coba query dengan kolom last_active_room_id (setelah migration 002)
      result = await pool.query(
        'SELECT id, full_name, identifier_number, role, coins, avatar_id, frame_id, tagline, last_active_room_id FROM users WHERE id = $1',
        [req.user.id]
      );
    } catch {
      // Fallback: kolom belum ada (migration 002 belum dijalankan)
      result = await pool.query(
        'SELECT id, full_name, identifier_number, role, coins, avatar_id, frame_id, tagline, NULL as last_active_room_id FROM users WHERE id = $1',
        [req.user.id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 GET ME ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  const { avatar_id, frame_id, tagline, full_name, identifier_number } = req.body;
  try {
    await pool.query(
      'UPDATE users SET avatar_id = COALESCE($1, avatar_id), frame_id = COALESCE($2, frame_id), tagline = COALESCE($3, tagline), full_name = COALESCE($4, full_name), identifier_number = COALESCE($5, identifier_number) WHERE id = $6',
      [avatar_id, frame_id, tagline, full_name, identifier_number, req.user.id]
    );
    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (err) {
    console.error('🔥 UPDATE PROFILE ERROR:', err);
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
});

// Delete Account
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Akun berhasil dihapus' });
  } catch (err) {
    console.error('🔥 DELETE ACCOUNT ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus akun' });
  }
});

// ─── SET ACTIVE ROOM (persist ke database) ─────────────────────────────
router.put('/active-room', authenticateToken, async (req, res) => {
  const { room_id } = req.body;
  try {
    await pool.query(
      'UPDATE users SET last_active_room_id = $1 WHERE id = $2',
      [room_id || null, req.user.id]
    );
    res.json({ message: 'Active room updated' });
  } catch (err) {
    console.error('🔥 SET ACTIVE ROOM ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan active room' });
  }
});

module.exports = router;
