-- ============================================================
-- Migration 004: Production Performance Indexes
-- ============================================================
-- ARKON v1.0 — TASK-PERF-003
-- Additional indexes for production query performance
-- Based on SSD §5.2 recommendations
-- ============================================================

-- Class membership lookups (used in room queries, leaderboard)
CREATE INDEX IF NOT EXISTS idx_class_members_room ON class_members(room_id);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);

-- IRT student ability per room (adaptive quiz lookups)
CREATE INDEX IF NOT EXISTS idx_student_ability_room ON student_ability(room_id);
CREATE INDEX IF NOT EXISTS idx_student_ability_student ON student_ability(student_id);

-- Coin transactions (leaderboard, transaction history)
CREATE INDEX IF NOT EXISTS idx_coin_transactions_student ON coin_transactions(student_id, created_at DESC);

-- Live quiz answers (session results aggregation)
CREATE INDEX IF NOT EXISTS idx_live_quiz_answers_session ON live_quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_live_quiz_answers_student ON live_quiz_answers(student_id);

-- Tournament lookups
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);

-- PC builds (showroom queries)
CREATE INDEX IF NOT EXISTS idx_pc_builds_student ON pc_builds(student_id);

-- Daily logins (streak calculation)
CREATE INDEX IF NOT EXISTS idx_daily_logins_student ON daily_logins(student_id, login_date DESC);

-- Rooms by dosen (lecturer dashboard)
CREATE INDEX IF NOT EXISTS idx_rooms_dosen ON rooms(dosen_id);

-- Materials by room
CREATE INDEX IF NOT EXISTS idx_materials_room ON materials(room_id);
