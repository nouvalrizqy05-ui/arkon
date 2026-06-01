const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ─── Create quiz session ───────────────────────────────────────────
router.post('/create', authenticateToken, async (req, res) => {
  const { room_id, title, questions } = req.body;
  try {
    const session = await pool.query(
      'INSERT INTO live_quiz_sessions (room_id, dosen_id, title) VALUES ($1, $2, $3) RETURNING *',
      [room_id, req.user.id, title]
    );
    const sessionId = session.rows[0].id;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query(
        'INSERT INTO live_quiz_questions (session_id, question_text, options, correct_index, duration_seconds, question_order) VALUES ($1, $2, $3, $4, $5, $6)',
        [sessionId, q.question_text, JSON.stringify(q.options), q.correct_index, q.duration_seconds || 20, i + 1]
      );
    }

    const allQuestions = await pool.query(
      'SELECT * FROM live_quiz_questions WHERE session_id = $1 ORDER BY question_order',
      [sessionId]
    );
    res.status(201).json({ session: session.rows[0], questions: allQuestions.rows });
  } catch (err) {
    console.error('🔥 LIVE QUIZ CREATE ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat sesi kuis' });
  }
});

// ─── Submit answer ─────────────────────────────────────────────────
router.post('/answer', authenticateToken, async (req, res) => {
  const { session_id, question_id, student_id, selected_index, correct_index, answer_time_ms, duration_seconds } = req.body;
  try {
    const exists = await pool.query(
      'SELECT id FROM live_quiz_answers WHERE session_id = $1 AND question_id = $2 AND student_id = $3',
      [session_id, question_id, student_id]
    );
    if (exists.rows.length > 0) return res.status(200).json({ message: 'Sudah menjawab', duplicate: true });

    const is_correct = selected_index === correct_index;
    const timeRatio = Math.max(0, 1 - (answer_time_ms / (duration_seconds * 1000)));
    const score = is_correct ? Math.round(500 + (500 * timeRatio)) : 0;

    await pool.query(
      'INSERT INTO live_quiz_answers (session_id, question_id, student_id, selected_index, is_correct, answer_time_ms, score) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [session_id, question_id, student_id, selected_index, is_correct, answer_time_ms, score]
    );

    res.json({ is_correct, score, answer_time_ms });
  } catch (err) {
    console.error('🔥 LIVE QUIZ ANSWER ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan jawaban' });
  }
});

// ─── Get leaderboard ───────────────────────────────────────────────
router.get('/leaderboard/:sessionId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.student_id, u.full_name as student_name,
        SUM(a.score)::int as total_score,
        COUNT(CASE WHEN a.is_correct THEN 1 END)::int as correct_count,
        COUNT(a.id)::int as total_answers
      FROM live_quiz_answers a
      JOIN users u ON a.student_id = u.id
      WHERE a.session_id = $1
      GROUP BY a.student_id, u.full_name
      ORDER BY total_score DESC
    `, [req.params.sessionId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil leaderboard' });
  }
});

// ─── FR-LIVE-007: Save results + push to analytics (N-Gain pipeline) ─
router.post('/save-results', authenticateToken, async (req, res) => {
  const { session_id, room_id } = req.body;
  try {
    // 1. Aggregate scores per student
    const scores = await pool.query(`
      SELECT
        a.student_id,
        SUM(a.score)::int as total_score,
        COUNT(*)::int as answers_count,
        COUNT(CASE WHEN a.is_correct THEN 1 END)::int as correct_count,
        COUNT(lqq.id)::int as total_questions
      FROM live_quiz_answers a
      JOIN live_quiz_questions lqq ON a.question_id = lqq.id
      WHERE a.session_id = $1
      GROUP BY a.student_id
      ORDER BY total_score DESC
    `, [session_id]);

    // 2. Mark session ended
    await pool.query(
      'UPDATE live_quiz_sessions SET status = $1, ended_at = NOW() WHERE id = $2',
      ['ended', session_id]
    );

    // 3. Coin rewards for top 3
    const rewards = [500, 300, 150];
    for (let i = 0; i < Math.min(3, scores.rows.length); i++) {
      const { student_id, total_score } = scores.rows[i];
      const reward = rewards[i];
      await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2', [reward, student_id]);
      await pool.query(
        'INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)',
        [student_id, reward, `Live Quiz Rank #${i + 1} (Score: ${total_score})`]
      );
    }

    // 4. FR-LIVE-007: Push normalized score (0-100) to analytics table
    //    This enables N-Gain calculation: pre-test = first analytics entry, post-test = last entry
    if (room_id) {
      for (const row of scores.rows) {
        const pct = row.total_questions > 0
          ? Math.round((row.correct_count / row.total_questions) * 100)
          : 0;
        // Insert into analytics with source = 'live_quiz' for traceability
        await pool.query(
          `INSERT INTO analytics (student_id, room_id, score, source, created_at)
           VALUES ($1, $2, $3, 'live_quiz', NOW())
           ON CONFLICT DO NOTHING`,
          [row.student_id, room_id, pct]
        ).catch(() => {
          // Fallback: insert without ON CONFLICT if schema doesn't have source column yet
          return pool.query(
            'INSERT INTO analytics (student_id, room_id, score, created_at) VALUES ($1, $2, $3, NOW())',
            [row.student_id, room_id, pct]
          );
        });
      }
    }

    res.json({ message: 'Hasil kuis tersimpan', leaderboard: scores.rows });
  } catch (err) {
    console.error('🔥 LIVE QUIZ SAVE ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan hasil kuis' });
  }
});

// ─── Get session detail (for dosen review) ────────────────────────
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const session = await pool.query(
      'SELECT lqs.*, r.course_name FROM live_quiz_sessions lqs LEFT JOIN rooms r ON lqs.room_id = r.id WHERE lqs.id = $1',
      [req.params.sessionId]
    );
    if (session.rows.length === 0) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    const questions = await pool.query(
      'SELECT * FROM live_quiz_questions WHERE session_id = $1 ORDER BY question_order',
      [req.params.sessionId]
    );
    res.json({ session: session.rows[0], questions: questions.rows });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail sesi' });
  }
});

// ─── List sessions for a room ─────────────────────────────────────
router.get('/room/:roomId/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lqs.*, u.full_name as dosen_name,
        (SELECT COUNT(*) FROM live_quiz_questions WHERE session_id = lqs.id)::int as question_count
       FROM live_quiz_sessions lqs
       LEFT JOIN users u ON lqs.dosen_id = u.id
       WHERE lqs.room_id = $1
       ORDER BY lqs.created_at DESC`,
      [req.params.roomId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar sesi' });
  }
});

module.exports = router;
