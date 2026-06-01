-- ============================================================
-- Migration 003: Refresh Token Revocation System
-- ============================================================
-- ARKON v3.0 — TASK-SEC-001
-- Implements server-side refresh token storage for proper logout
-- Satisfies: FR-AUTH-006, NFR-SEC-008
-- ============================================================

-- Tabel untuk menyimpan refresh token yang aktif
-- Setiap login menghasilkan entry baru, logout me-revoke entry
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- User agent dan IP untuk audit trail
  user_agent TEXT,
  ip_address VARCHAR(45)
);

-- Index untuk lookup cepat saat refresh token digunakan
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE revoked = FALSE;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- Cleanup: hapus token expired yang sudah lebih dari 30 hari
-- (Dapat dijalankan via cron atau scheduled task)
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '30 days';

-- ============================================================
-- Migration 003b: Audit Log Table
-- ============================================================
-- Untuk aksi sensitif (NFR-SEC-007)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
