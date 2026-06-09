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

// ─── GET full settings for settings page ───────────────────────────────────
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, identifier_number,
        COALESCE(whatsapp, '') as whatsapp,
        COALESCE(language, 'id') as language,
        COALESCE(timezone, 'Asia/Jakarta') as timezone,
        COALESCE(notif_email_announcements, true) as notif_email_announcements,
        COALESCE(notif_email_activities, true) as notif_email_activities,
        COALESCE(notif_browser_push, false) as notif_browser_push,
        COALESCE(notif_sound, true) as notif_sound,
        COALESCE(appearance_theme, 'system') as appearance_theme,
        COALESCE(appearance_density, 'comfortable') as appearance_density,
        COALESCE(accessibility_reduced_motion, false) as accessibility_reduced_motion,
        COALESCE(accessibility_screen_reader, true) as accessibility_screen_reader
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    // Fallback: table columns may not exist yet, return safe defaults
    console.error('🔥 GET SETTINGS ERROR:', err.message);
    try {
      const basic = await pool.query(
        'SELECT id, full_name, email, role, identifier_number FROM users WHERE id = $1',
        [req.user.id]
      );
      if (basic.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
      const u = basic.rows[0];
      res.json({
        ...u,
        whatsapp: '', language: 'id', timezone: 'Asia/Jakarta',
        notif_email_announcements: true, notif_email_activities: true,
        notif_browser_push: false, notif_sound: true,
        appearance_theme: 'system', appearance_density: 'comfortable',
        accessibility_reduced_motion: false, accessibility_screen_reader: true
      });
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Gagal mengambil pengaturan' });
    }
  }
});

// ─── PUT update settings ────────────────────────────────────────────────────
router.put('/settings', authenticateToken, async (req, res) => {
  const {
    full_name, email, whatsapp, language, timezone,
    notif_email_announcements, notif_email_activities, notif_browser_push, notif_sound,
    appearance_theme, appearance_density,
    accessibility_reduced_motion, accessibility_screen_reader
  } = req.body;

  try {
    // Auto-migrate: ensure all settings columns exist before attempting update
    const migrationCols = [
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp TEXT",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'id'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_email_announcements BOOLEAN DEFAULT TRUE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_email_activities BOOLEAN DEFAULT TRUE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_browser_push BOOLEAN DEFAULT FALSE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_sound BOOLEAN DEFAULT TRUE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS appearance_theme TEXT DEFAULT 'system'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS appearance_density TEXT DEFAULT 'comfortable'",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_reduced_motion BOOLEAN DEFAULT FALSE",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_screen_reader BOOLEAN DEFAULT TRUE",
    ];
    for (const sql of migrationCols) {
      await pool.query(sql).catch(() => {}); // Silently skip if already exists
    }

    await pool.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        whatsapp = $3,
        language = $4,
        timezone = $5,
        notif_email_announcements = $6,
        notif_email_activities = $7,
        notif_browser_push = $8,
        notif_sound = $9,
        appearance_theme = $10,
        appearance_density = $11,
        accessibility_reduced_motion = $12,
        accessibility_screen_reader = $13
      WHERE id = $14`,
      [
        full_name, email, whatsapp || null, language || 'id', timezone || 'Asia/Jakarta',
        notif_email_announcements ?? true, notif_email_activities ?? true,
        notif_browser_push ?? false, notif_sound ?? true,
        appearance_theme || 'system', appearance_density || 'comfortable',
        accessibility_reduced_motion ?? false, accessibility_screen_reader ?? true,
        req.user.id
      ]
    );

    res.json({ message: 'Pengaturan berhasil disimpan!', updated_name: full_name });
  } catch (err) {
    console.error('🔥 PUT SETTINGS ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan' });
  }
});

// ─── Migration endpoint: add settings columns if not exist ─────────────────
// Run once after deployment to add new columns to existing DB
router.post('/settings/migrate', authenticateToken, async (req, res) => {
  if (req.user.role !== 'dosen') return res.status(403).json({ error: 'Akses ditolak' });
  const cols = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'id'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_email_announcements BOOLEAN DEFAULT TRUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_email_activities BOOLEAN DEFAULT TRUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_browser_push BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS notif_sound BOOLEAN DEFAULT TRUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS appearance_theme TEXT DEFAULT 'system'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS appearance_density TEXT DEFAULT 'comfortable'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_reduced_motion BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_screen_reader BOOLEAN DEFAULT TRUE",
  ];
  const results = [];
  for (const sql of cols) {
    try {
      await pool.query(sql);
      results.push({ sql, status: 'ok' });
    } catch (e) {
      results.push({ sql, status: 'error', error: e.message });
    }
  }
  res.json({ message: 'Migration selesai', results });
});

// ─── Export personal data ───────────────────────────────────────────────────
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    const user = await pool.query(
      'SELECT id, full_name, email, identifier_number, role, coins, tagline, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const rooms = await pool.query(
      `SELECT r.id, r.name, r.room_code, r.description, rm.joined_at
       FROM rooms r JOIN room_members rm ON r.id = rm.room_id
       WHERE rm.user_id = $1`, [req.user.id]
    ).catch(() => ({ rows: [] }));

    const exportData = {
      export_date: new Date().toISOString(),
      profile: user.rows[0],
      rooms: rooms.rows,
    };
    res.setHeader('Content-Disposition', 'attachment; filename="arkon-data-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(exportData);
  } catch (err) {
    console.error('🔥 EXPORT DATA ERROR:', err);
    res.status(500).json({ error: 'Gagal mengekspor data' });
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
