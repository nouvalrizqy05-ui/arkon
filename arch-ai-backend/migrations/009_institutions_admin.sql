-- ============================================================
-- Migration 009: Institutions Admin Panel — TASK-TENANT-001/002
-- ============================================================
-- ARKON v1.0 — F-010 Multi-Tenant Support (full implementation)
-- Adds institution admin role + wizard onboarding support
-- ============================================================

-- Institutions table (if not exists from migration 005)
CREATE TABLE IF NOT EXISTS institutions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  domain          VARCHAR(100),               -- e.g. "univ.ac.id" for auto-assign
  short_name      VARCHAR(50),                -- e.g. "UNIV"
  logo_url        TEXT,
  admin_email     VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  max_users       INT DEFAULT 500,
  subscription_tier VARCHAR(20) DEFAULT 'pilot', -- pilot / standard / enterprise
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

-- Add institution_id to users (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;

-- Add institution_id to rooms (if not exists from migration 005)  
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;

-- Institution admin role (extends existing role system)
-- Note: stored in users.role as 'admin_institusi'
-- existing CHECK constraint may need update:
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('mahasiswa', 'dosen', 'admin_institusi', 'superadmin'));

-- Dosen onboarding progress (TASK-ONBOARD-001)
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  step          VARCHAR(50) NOT NULL,          -- 'create_room', 'invite_students', 'launch_quiz', 'complete'
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, step)
);

-- Institution invite codes (for batch student enrollment)
CREATE TABLE IF NOT EXISTS institution_invite_codes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  code          VARCHAR(20) UNIQUE NOT NULL,
  role          VARCHAR(20) DEFAULT 'mahasiswa',
  max_uses      INT DEFAULT 100,
  uses_count    INT DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for multi-tenant queries
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_rooms_institution ON rooms(institution_id);

COMMENT ON TABLE institutions IS 'Multi-tenant: satu record per PT/institusi. F-010.';
COMMENT ON TABLE onboarding_progress IS 'Tracks dosen onboarding steps. TASK-ONBOARD-001.';
