-- ============================================================
-- Migration 008: Quiz Questions Authoring Table
-- ============================================================
-- ARKON v1.0 — FR-IRT-007 (Content Authoring Tool)
-- Enables dosen to create, edit, delete quiz questions via UI
-- Also adds source tracking to analytics for N-Gain pipeline
-- ============================================================

-- Quiz bank per room (dosen-managed)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id       UUID REFERENCES rooms(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  options       JSONB NOT NULL,          -- array of 4 strings
  correct_index INT NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  difficulty    INT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3), -- 1=easy,2=med,3=hard
  topic         VARCHAR(100),
  explanation   TEXT,                    -- shown after answer for learning
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_room     ON quiz_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_diff     ON quiz_questions(room_id, difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_topic    ON quiz_questions(room_id, topic);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active   ON quiz_questions(room_id) WHERE is_active = TRUE;

-- Add source tracking to analytics (enables live quiz → N-Gain)
ALTER TABLE analytics ADD COLUMN IF NOT EXISTS source VARCHAR(30) DEFAULT 'quiz';
CREATE INDEX IF NOT EXISTS idx_analytics_room_student ON analytics(room_id, student_id, created_at);

-- Add explanation column to analytics entries if needed
COMMENT ON TABLE quiz_questions IS 'Dosen-managed quiz bank per room. FR-IRT-007.';
COMMENT ON COLUMN analytics.source IS 'Source: quiz | live_quiz | pretest | posttest';
