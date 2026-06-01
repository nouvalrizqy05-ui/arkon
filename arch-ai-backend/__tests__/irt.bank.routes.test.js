/**
 * ARKON IRT Bank Routes Tests
 * FR-IRT-006 (bank health) + FR-IRT-007 (quiz authoring CRUD)
 */

jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => { req.user = { id: 'dosen-001', role: 'dosen' }; next(); },
  requireRole: () => (req, _res, next) => next()
}));

const request = require('supertest');
const express = require('express');
const pool = require('../config/db');
const irtRouter = require('../routes/irt.routes');

const app = express();
app.use(express.json());
app.use('/api/irt', irtRouter);

describe('IRT Bank Health — FR-IRT-006', () => {
  beforeEach(() => jest.clearAllMocks());

  test('GET /bank/health returns stats when questions exist', async () => {
    pool.query.mockResolvedValue({ rows: [
      { difficulty: 1, count: 35 },
      { difficulty: 2, count: 40 },
      { difficulty: 3, count: 30 }
    ]});
    const res = await request(app).get('/api/irt/bank/health');
    expect(res.status).toBe(200);
    expect(res.body.total_questions).toBe(105);
    expect(res.body.is_sufficient).toBe(true);
    expect(res.body.warnings).toHaveLength(0);
  });

  test('returns warnings when topics below threshold', async () => {
    pool.query.mockResolvedValue({ rows: [
      { difficulty: 1, count: 10 },
      { difficulty: 2, count: 15 }
    ]});
    const res = await request(app).get('/api/irt/bank/health');
    expect(res.status).toBe(200);
    expect(res.body.is_sufficient).toBe(false);
    expect(res.body.warnings.length).toBeGreaterThan(0);
  });

  test('handles empty bank gracefully', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/irt/bank/health');
    expect(res.status).toBe(200);
    expect(res.body.total_questions).toBe(0);
    expect(res.body.is_sufficient).toBe(false);
  });
});

describe('IRT Bank CRUD — FR-IRT-007', () => {
  beforeEach(() => jest.clearAllMocks());

  const validQuestion = {
    question_text: 'Apa singkatan dari CPU?',
    options: ['Central Processing Unit', 'Core Processor Unit', 'Computer Power Unit', 'Central Program Unit'],
    correct_index: 0,
    difficulty: 1,
    topic: 'CPU Architecture',
    explanation: 'CPU = Central Processing Unit, otak dari komputer.'
  };

  // POST: create
  test('POST /bank/:roomId creates question for dosen', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room-001' }] }) // owner check
      .mockResolvedValueOnce({ rows: [{ id: 'q-001', ...validQuestion }] }); // insert
    const res = await request(app).post('/api/irt/bank/room-001').send(validQuestion);
    expect(res.status).toBe(201);
    expect(res.body.question_text).toBe(validQuestion.question_text);
  });

  test('POST /bank/:roomId rejects invalid question', async () => {
    const res = await request(app).post('/api/irt/bank/room-001').send({ question_text: 'Bad Q' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/options/i);
  });

  test('POST /bank/:roomId rejects invalid difficulty', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 'room-001' }] });
    const res = await request(app).post('/api/irt/bank/room-001').send({ ...validQuestion, difficulty: 5 });
    expect(res.status).toBe(400);
  });

  // GET: list
  test('GET /bank/:roomId returns paginated questions', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'q-1', question_text: 'Q1', difficulty: 1 }] }) // list
      .mockResolvedValueOnce({ rows: [{ total: 1 }] }); // count
    const res = await request(app).get('/api/irt/bank/room-001');
    expect(res.status).toBe(200);
    expect(res.body.questions).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  // PUT: update
  test('PUT /bank/:roomId/:questionId updates question', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room-001' }] }) // owner check
      .mockResolvedValueOnce({ rows: [{ id: 'q-001', question_text: 'Updated Q' }] }); // update
    const res = await request(app).put('/api/irt/bank/room-001/q-001').send({ question_text: 'Updated Q' });
    expect(res.status).toBe(200);
  });

  test('PUT /bank/:roomId/:questionId returns 404 if not found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room-001' }] })
      .mockResolvedValueOnce({ rows: [] }); // no update
    const res = await request(app).put('/api/irt/bank/room-001/nonexistent').send({ question_text: 'X' });
    expect(res.status).toBe(404);
  });

  // DELETE
  test('DELETE /bank/:roomId/:questionId removes question', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room-001' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'q-001' }] });
    const res = await request(app).delete('/api/irt/bank/room-001/q-001');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/dihapus/);
  });

  // Bulk import
  test('POST /bulk-import imports multiple questions', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room-001' }] }) // owner check
      .mockResolvedValueOnce({ rows: [] }) // begin
      .mockResolvedValue({ rows: [] }); // each insert + commit

    const questions = Array(3).fill(null).map((_, i) => ({
      question_text: `Question ${i}`,
      options: ['A', 'B', 'C', 'D'],
      correct_index: 0,
      difficulty: 1,
      topic: 'CPU Architecture'
    }));

    const res = await request(app).post('/api/irt/bank/room-001/bulk-import').send({ questions });
    expect(res.status).toBe(201);
    expect(res.body.inserted).toBe(3);
  });

  test('POST /bulk-import rejects > 200 questions', async () => {
    const questions = Array(201).fill({ question_text: 'Q', options: ['A','B','C','D'], correct_index: 0 });
    const res = await request(app).post('/api/irt/bank/room-001/bulk-import').send({ questions });
    expect(res.status).toBe(400);
  });
});
