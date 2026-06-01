-- ============================================================
-- ARKON Room System Rebuild — Database Migration
-- Tinkercad-style Classroom Architecture
-- ============================================================

-- 1. Extend ROOMS table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type VARCHAR(20) DEFAULT 'classroom';
-- room_type: 'classroom' (Dosen), 'personal' (Mahasiswa), 'collaborative' (Mahasiswa + invite)

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS owner_id UUID;
-- Generic owner — can be dosen or mahasiswa (replaces dosen_id for personal rooms)

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_safe_mode BOOLEAN DEFAULT false;
-- Safe Mode: restricts student from seeing public gallery, external content

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS collab_mode VARCHAR(20) DEFAULT 'isolation';
-- 'isolation' = only owner + dosen, 'collaborative' = can invite others

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 50;

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS invite_code VARCHAR(20);
-- For collaborative personal rooms (different from room_code)

-- Backfill owner_id from dosen_id for existing rooms
UPDATE rooms SET owner_id = dosen_id WHERE owner_id IS NULL AND dosen_id IS NOT NULL;
UPDATE rooms SET room_type = 'classroom' WHERE room_type IS NULL;

-- 2. ACTIVITIES table (Assignments/Tasks from Dosen)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activity_type VARCHAR(50) DEFAULT 'free_build',
  -- Types: 'free_build', 'guided_build', 'quiz_challenge', 'detective_mission', 'budget_challenge'
  template_data JSONB DEFAULT '{}',
  -- Template: starter config for the activity (pre-selected components, budget limit, target use-case, etc.)
  config JSONB DEFAULT '{}',
  -- Config: budget_limit, target_use (gaming/office/editing), time_limit_minutes, required_components
  due_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_room ON activities(room_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);

-- 3. STUDENT_WORK table (Student submissions / auto-saved work)
CREATE TABLE IF NOT EXISTS student_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  -- NULL activity_id = free build (not from an assignment)
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  work_type VARCHAR(50) DEFAULT 'assembly',
  -- Types: 'assembly', 'quiz_result', 'detective_result'
  work_data JSONB NOT NULL DEFAULT '{}',
  -- Stores: equipped components, assembly state, quiz answers, etc.
  score INTEGER,
  score_breakdown JSONB DEFAULT '{}',
  -- { compatibility: 40, assembly_order: 25, budget_efficiency: 20, speed: 15 }
  is_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP,
  feedback_read BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_work_room ON student_work(room_id);
CREATE INDEX IF NOT EXISTS idx_student_work_student ON student_work(student_id);
CREATE INDEX IF NOT EXISTS idx_student_work_activity ON student_work(activity_id);

-- 4. PROJECT_NOTES table (Tinkercad-style feedback)
CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES student_work(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name VARCHAR(255),
  author_role VARCHAR(20) NOT NULL,
  -- 'dosen' or 'mahasiswa'
  content TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'feedback',
  -- 'feedback', 'correction', 'praise', 'question'
  position_data JSONB DEFAULT '{}',
  -- Optional: { component: 'CPU', slot: 'cpu_socket', x: 100, y: 200 }
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_work ON project_notes(work_id);
CREATE INDEX IF NOT EXISTS idx_notes_author ON project_notes(author_id);

-- 5. SANDBOX_SESSIONS table (Dosen Test Mode — isolated from analytics)
CREATE TABLE IF NOT EXISTS sandbox_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  dosen_id UUID NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  session_type VARCHAR(50) DEFAULT 'test_mode',
  -- 'test_mode' (dosen testing), 'preview' (dosen previewing student work)
  session_data JSONB DEFAULT '{}',
  -- Same structure as student_work.work_data but isolated
  score INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sandbox_room ON sandbox_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_dosen ON sandbox_sessions(dosen_id);

-- 7. Grading Workflow — Add review columns to student_work
ALTER TABLE student_work ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE student_work ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) DEFAULT 'pending';
-- review_status: 'pending', 'graded', 'revision_needed', 'approved'
ALTER TABLE student_work ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE student_work ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE student_work ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- 6. ACTIVITY_TEMPLATES table (Reusable templates for quick activity creation)
CREATE TABLE IF NOT EXISTS activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  activity_type VARCHAR(50) DEFAULT 'free_build',
  template_data JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  -- Public templates can be used by any dosen
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_creator ON activity_templates(created_by);
