-- ============================================================
-- ARKON Migration 002 — User Preferences & Active Room State
-- Memindahkan active_room_id dari localStorage ke database
-- ============================================================

-- 1. Tambahkan kolom last_active_room_id ke tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- 2. Tabel user_preferences untuk menyimpan state UI lainnya di masa depan
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pref_key VARCHAR(100) NOT NULL,
  pref_value TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, pref_key)
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);

-- Verifikasi
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active_room_id';
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'user_preferences';
