-- ============================================================
-- Migration 005: Room Archive & Multi-tenant Foundation
-- ============================================================
-- ARKON v1.0 — TASK-FEAT-003 + TASK-TENANT-001 (foundation)
-- Adds room archiving and prepares for multi-tenant support
-- ============================================================

-- Room status for archive feature
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- Multi-tenant foundation: institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  admin_email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add institution_id to users (nullable for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);

-- Add institution_id to rooms (nullable for backward compatibility)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_rooms_institution ON rooms(institution_id);
