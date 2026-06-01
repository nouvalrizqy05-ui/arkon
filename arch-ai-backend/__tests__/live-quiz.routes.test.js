/**
 * ARKON Live Quiz Routes Tests
 * FR-LIVE-001 to FR-LIVE-007
 */

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 'student-001', role: 'mahasiswa' };
    next();
  },
  requireRole: () => (req, _res, next) => next()
}));

const request = require('supertest');
const express = require('express');
const pool = require('../config/db');
const liveQuizRouter = require('../routes/live-quiz.routes');

const app = express();
app.use(express.json());
app.use('/api/live-quiz', liveQuizRouter);

describe('Live Quiz Routes', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  // ─── POST /create ─────────────────────────────────────
  describe('POST /api/live-quiz/create', () => {
    test('creates session with valid data', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: 'session-001', room_id: 'room-001', title: 'Quiz 1' }] })
        .mockResolvedValue({ rows: [] });

      const res = await request(app).post('/api/live-quiz/create').send({
        room_id: 'room-001',
        title: 'Quiz 1',
        questions: [{ question_text: 'Q1', options: ['A','B','C','D'], correct_index: 0, duration_seconds: 20 }]
      });

      expect(res.status).toBe(201);
      expect(res.body.session).toBeDefined();
    });

    test('returns 500 on DB error', async () => {
      pool.query.mockRejectedValue(new Error('DB down'));
      const res = await request(app).post('/api/live-quiz/create').send({ room_id: 'r1', title: 'T', questions: [] });
      expect(res.status).toBe(500);
    });
  });

  // ─── POST /answer ─────────────────────────────────────
  describe('POST /api/live-quiz/answer', () => {
    test('saves correct answer and returns score > 0', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // no duplicate check
        .mockResolvedValueOnce({ rows: [{ id: 'answer-001' }] }); // insert answer

      const res = await request(app).post('/api/live-quiz/answer').send({
        session_id: 'sess-1', question_id: 'q-1', student_id: 'student-001',
        selected_index: 2, correct_index: 2, answer_time_ms: 3000, duration_seconds: 20
      });

      expect(res.status).toBe(200);
      expect(res.body.is_correct).toBe(true);
      expect(res.body.score).toBeGreaterThan(0);
    });

    test('saves wrong answer and returns score 0', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const res = await request(app).post('/api/live-quiz/answer').send({
        session_id: 'sess-1', question_id: 'q-1', student_id: 'student-001',
        selected_index: 1, correct_index: 2, answer_time_ms: 5000, duration_seconds: 20
      });

      expect(res.status).toBe(200);
      expect(res.body.is_correct).toBe(false);
      expect(res.body.score).toBe(0);
    });

    test('rejects duplicate answers', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] }); // duplicate found
      const res = await request(app).post('/api/live-quiz/answer').send({
        session_id: 'sess-1', question_id: 'q-1', student_id: 'student-001',
        selected_index: 0, correct_index: 0, answer_time_ms: 1000, duration_seconds: 20
      });
      expect(res.status).toBe(200);
      expect(res.body.duplicate).toBe(true);
    });
  });

  // ─── GET /leaderboard/:sessionId ──────────────────────
  describe('GET /api/live-quiz/leaderboard/:sessionId', () => {
    test('returns sorted leaderboard', async () => {
      pool.query.mockResolvedValue({
        rows: [
          { student_id: 'u1', student_name: 'Alice', total_score: 950, correct_count: 8, total_answers: 10 },
          { student_id: 'u2', student_name: 'Bob',   total_score: 700, correct_count: 6, total_answers: 10 }
        ]
      });
      const res = await request(app).get('/api/live-quiz/leaderboard/sess-001');
      expect(res.status).toBe(200);
      expect(res.body[0].total_score).toBeGreaterThanOrEqual(res.body[1].total_score);
    });
  });

  // ─── POST /save-results (FR-LIVE-007) ─────────────────
  describe('POST /api/live-quiz/save-results — FR-LIVE-007 Analytics Pipeline', () => {
    test('saves results and pushes to analytics', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ student_id: 'u1', total_score: 900, correct_count: 9, total_questions: 10, answers_count: 10 }] }) // aggregate
        .mockResolvedValue({ rows: [] }); // all subsequent queries

      const res = await request(app).post('/api/live-quiz/save-results').send({
        session_id: 'sess-001',
        room_id: 'room-001'
      });
      expect(res.status).toBe(200);
      expect(res.body.leaderboard).toBeDefined();
      // analytics INSERT should have been called
      const calls = pool.query.mock.calls.map(c => c[0]);
      const analyticsCall = calls.find(q => typeof q === 'string' && q.includes('analytics'));
      expect(analyticsCall).toBeDefined();
    });

    test('works without room_id (no analytics push)', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // aggregate — empty
        .mockResolvedValue({ rows: [] });

      const res = await request(app).post('/api/live-quiz/save-results').send({ session_id: 'sess-002' });
      expect(res.status).toBe(200);
    });
  });
});
