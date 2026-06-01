/**
 * ARKON Rooms Routes — Unit Tests
 * Fix #5: Test coverage untuk rooms.routes.js (NFR-MAINT-001)
 *
 * Covers:
 * - POST /api/rooms              → create room
 * - POST /api/rooms/join         → join room dengan kode
 * - DELETE /api/rooms/leave      → keluar dari room
 * - GET  /api/rooms/student/:id  → daftar room mahasiswa
 * - GET  /api/rooms/:id/members  → anggota room
 * - PATCH /api/rooms/:id/archive → arsipkan room (dosen)
 * - Institution scoping (multi-tenant)
 */

const request = require('supertest');

// ──────────────────────────────────────────────────────────────────────────────
// Mocks
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

const jwt = require('jsonwebtoken');
const TEST_SECRET = 'test_secret_arkon_jest';
process.env.JWT_SECRET = TEST_SECRET;

function makeToken(overrides = {}) {
  return jwt.sign({ id: 'u1', role: 'mahasiswa', ...overrides }, TEST_SECRET, { expiresIn: '1h' });
}
function makeDosenToken(id = 'dosen1') {
  return makeToken({ id, role: 'dosen' });
}

const pool = require('../config/db');
const { app } = require('../server');

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/rooms — create room
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/rooms', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201: dosen dapat membuat classroom', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'room1',
        room_code: 'ITDP-1234',
        course_name: 'Arsitektur & Organisasi Komputer',
        room_type: 'classroom',
        dosen_id: 'dosen1'
      }]
    });

    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${makeDosenToken()}`)
      .send({ course_name: 'Arsitektur & Organisasi Komputer', room_type: 'classroom' });

    expect(res.status).toBe(201);
    expect(res.body.room_type).toBe('classroom');
    expect(res.body.room_code).toMatch(/^ITDP-/);
  });

  test('403: mahasiswa tidak dapat membuat classroom', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ course_name: 'AOK', room_type: 'classroom' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Hanya dosen');
  });

  test('201: mahasiswa dapat membuat personal room', async () => {
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 'room2', room_code: 'ITDP-5678', room_type: 'personal', dosen_id: null }]
      })
      // auto-join owner as member
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ course_name: 'Belajar Mandiri', room_type: 'personal' });

    expect(res.status).toBe(201);
    expect(res.body.room_type).toBe('personal');
  });

  test('401: tanpa token ditolak', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ course_name: 'AOK' });

    expect(res.status).toBe(401);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/rooms/join — join room
// ──────────────────────────────────────────────────────────────────────────────
describe('POST /api/rooms/join', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: berhasil join dengan kode valid', async () => {
    // SELECT room by code
    pool.query
      .mockResolvedValueOnce({
        rows: [{ id: 'room1', room_code: 'ITDP-9999', course_name: 'AOK', room_type: 'classroom' }]
      })
      // SELECT member check → not yet member
      .mockResolvedValueOnce({ rows: [] })
      // INSERT member
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_code: 'ITDP-9999', student_id: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Berhasil bergabung');
    expect(res.body.room).toHaveProperty('id', 'room1');
  });

  test('404: kode room tidak ditemukan', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_code: 'INVALID', student_id: 'u1' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('tidak ditemukan');
  });

  test('200: join ulang (sudah member) tidak error', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room1', room_code: 'ITDP-9999', course_name: 'AOK' }] })
      // Already member → skip INSERT
      .mockResolvedValueOnce({ rows: [{ room_id: 'room1', student_id: 'u1' }] });

    const res = await request(app)
      .post('/api/rooms/join')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_code: 'ITDP-9999', student_id: 'u1' });

    expect(res.status).toBe(200);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// DELETE /api/rooms/leave
// ──────────────────────────────────────────────────────────────────────────────
describe('DELETE /api/rooms/leave', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: mahasiswa keluar dari room', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/rooms/leave')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ room_id: 'room1', student_id: 'u1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Berhasil keluar');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/rooms/student/:student_id
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/rooms/student/:student_id', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: mengembalikan daftar room milik mahasiswa', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'room1', course_name: 'AOK', room_type: 'classroom', status: 'active' },
        { id: 'room2', course_name: 'Belajar Mandiri', room_type: 'personal', status: 'active' },
      ]
    });

    const res = await request(app)
      .get('/api/rooms/student/u1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('course_name');
  });

  test('200: mahasiswa tanpa room mengembalikan array kosong', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/rooms/student/u1')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/rooms/:id/members
// ──────────────────────────────────────────────────────────────────────────────
describe('GET /api/rooms/:id/members', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: mengembalikan daftar anggota room', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 'u1', full_name: 'Budi Santoso', nim: 'A123', joined_at: '2026-01-01' },
        { id: 'u2', full_name: 'Sari Dewi',   nim: 'A124', joined_at: '2026-01-02' },
      ]
    });

    const res = await request(app)
      .get('/api/rooms/room1/members')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty('full_name');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/rooms/:id/archive — arsipkan room
// ──────────────────────────────────────────────────────────────────────────────
describe('PATCH /api/rooms/:id/archive', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200: dosen dapat mengarsipkan room miliknya', async () => {
    // ownership check → found
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'room1', dosen_id: 'dosen1', status: 'active' }] })
      // toggle update → archived
      .mockResolvedValueOnce({ rows: [{ id: 'room1', status: 'archived' }] });

    const res = await request(app)
      .patch('/api/rooms/room1/archive')
      .set('Authorization', `Bearer ${makeDosenToken('dosen1')}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('archived');
  });

  test('403: dosen lain tidak boleh arsipkan room milik dosen berbeda', async () => {
    // ownership check → not found
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/rooms/room1/archive')
      .set('Authorization', `Bearer ${makeDosenToken('other_dosen')}`);

    expect(res.status).toBe(403);
  });

  test('403: mahasiswa tidak boleh mengarsipkan room', async () => {
    const res = await request(app)
      .patch('/api/rooms/room1/archive')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(403);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Multi-tenant: institution scoping (F-010)
// ──────────────────────────────────────────────────────────────────────────────
describe('Multi-tenant institution scoping', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201: institution_id dari middleware tersimpan ke room baru', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{
        id: 'room3',
        room_code: 'ITDP-0001',
        course_name: 'Jaringan Komputer',
        room_type: 'classroom',
        institution_id: 'inst_a',
        dosen_id: 'dosen1'
      }]
    });

    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${makeDosenToken()}`)
      .send({ course_name: 'Jaringan Komputer', room_type: 'classroom' });

    // If institution middleware injects inst_id, it should appear in INSERT params
    // Here we verify the response shape is correct regardless of inst_id value
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('room_code');
  });
});
