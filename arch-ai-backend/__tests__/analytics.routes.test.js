/**
 * ARKON Analytics Routes — Unit Tests
 * Fix #5: Test coverage untuk analytics.routes.js (NFR-MAINT-001)
 *
 * Covers:
 * - POST /api/analytics        → simpan skor quiz
 * - GET  /api/analytics/student-insight/:id → insights per mahasiswa
 * - GET  /api/analytics/n-gain/:room_id     → kalkulasi N-Gain Hake
 * - GET  /api/analytics/:room_id            → ringkasan analytics room
 */

const request = require('supertest');

// ──────────────────────────────────────────────────────────────────────────────
// Mock helpers
// ──────────────────────────────────────────────────────────────────────────────

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../config/redis', () => ({
  pub: { duplicate: jest.fn(() => ({ connect: jest.fn(), on: jest.fn(), disconnect: jest.fn() })) },
  sub: { duplicate: jest.fn(() => ({ connect: jest.fn(), on: jest.fn(), subscribe: jest.fn(), disconnect: jest.fn() })) },
  client: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
  isConnected: jest.fn().mockReturnValue(false),
}));

jest.mock('../config/sentry', () => ({ setupSentry: jest.fn() }));

// JWT helper: creates a signed token for the mock user
const jwt = require('jsonwebtoken');
const TEST_SECRET = 'test_secret_arkon_jest';
process.env.JWT_SECRET = TEST_SECRET;

function makeToken(payload = {}) {
  return jwt.sign({ id: 'u1', role: 'mahasiswa', ...payload }, TEST_SECRET, { expiresIn: '1h' });
}
function makeDosenToken() {
  return makeToken({ id: 'dosen1', role: 'dosen' });
}

const pool = require('../config/db');
const { app } = require('../server');

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/analytics — simpan skor quiz
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('201: menyimpan entri analytics baru', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, room_id: 'room1', student_id: 'u1', score: 80 }]
    });

    const res = await request(app)
      .post('/api/analytics')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_id: 'room1', student_id: 'u1', score: 80, material_id: 'mat1' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body.score).toBe(80);
  });

  test('500: database error dikembalikan sebagai error JSON', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB failure'));

    const res = await request(app)
      .post('/api/analytics')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_id: 'room1', student_id: 'u1', score: 70 });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  test('401: tanpa token harus ditolak', async () => {
    const res = await request(app)
      .post('/api/analytics')
      .send({ room_id: 'room1', student_id: 'u1', score: 60 });

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/student-insight/:studentId
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/analytics/student-insight/:studentId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: mahasiswa bisa mengakses insight miliknya sendiri', async () => {
    // topicScores
    pool.query
      .mockResolvedValueOnce({ rows: [{ topic_raw: 'CPU', avg_score: 75, attempts: 4 }] })
      // overall stats
      .mockResolvedValueOnce({ rows: [{ avg_score: 75, total_quizzes: 5, best_score: 90, worst_score: 55 }] })
      // activity
      .mockResolvedValueOnce({ rows: [{ day: '2026-05-01', count: 3 }] })
      // streak
      .mockResolvedValueOnce({ rows: [{ current_streak: 5, max_streak: 7 }] })
      // badges count
      .mockResolvedValueOnce({ rows: [{ count: 3 }] })
      // coins
      .mockResolvedValueOnce({ rows: [{ coins: 150 }] });

    const res = await request(app)
      .get('/api/analytics/student-insight/u1')
      .set('Authorization', `Bearer ${makeToken({ id: 'u1' })}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('stats');
    expect(res.body.stats.total_quizzes).toBe(5);
  });

  test('403: mahasiswa tidak boleh akses insight orang lain', async () => {
    const res = await request(app)
      .get('/api/analytics/student-insight/other_user_id')
      .set('Authorization', `Bearer ${makeToken({ id: 'u1' })}`);

    expect(res.status).toBe(403);
  });

  test('200: dosen bisa mengakses insight mahasiswa mana pun', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ avg_score: 0, total_quizzes: 0, best_score: 0, worst_score: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
      .mockResolvedValueOnce({ rows: [{ coins: 0 }] });

    const res = await request(app)
      .get('/api/analytics/student-insight/u1')
      .set('Authorization', `Bearer ${makeDosenToken()}`);

    expect(res.status).toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/n-gain/:room_id — kalkulasi N-Gain Hake
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/analytics/n-gain/:room_id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: mengembalikan N-Gain data untuk dosen', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { student_id: 'u1', student_name: 'Budi', pre_score: 40, post_score: 80 },
        { student_id: 'u2', student_name: 'Sari', pre_score: 50, post_score: 90 },
      ]
    });

    const res = await request(app)
      .get('/api/analytics/n-gain/room1')
      .set('Authorization', `Bearer ${makeDosenToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('students');
    expect(res.body).toHaveProperty('classAverage');
    expect(res.body.students).toHaveLength(2);
    // N-Gain Hake: (post - pre) / (100 - pre)
    // Budi: (80-40)/(100-40) ≈ 0.667 (Sedang/Tinggi)
    expect(res.body.classAverage.gain).toBeGreaterThan(0);
  });

  test('200: data kosong → classAverage.gain = 0', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/analytics/n-gain/room_empty')
      .set('Authorization', `Bearer ${makeDosenToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.students).toHaveLength(0);
    expect(res.body.classAverage.gain).toBe(0);
  });

  test('403: mahasiswa tidak boleh akses endpoint ini', async () => {
    const res = await request(app)
      .get('/api/analytics/n-gain/room1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/:room_id — ringkasan analytics room
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/analytics/:room_id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: mengembalikan daftar analytics untuk room', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, student_id: 'u1', score: 85, room_id: 'room1' },
        { id: 2, student_id: 'u2', score: 70, room_id: 'room1' },
      ]
    });

    const res = await request(app)
      .get('/api/analytics/room1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  test('401: tanpa token ditolak', async () => {
    const res = await request(app).get('/api/analytics/room1');
    expect(res.status).toBe(401);
  });
});
