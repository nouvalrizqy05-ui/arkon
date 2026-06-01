const request = require('supertest');
const { app, server } = require('../server');

// Mock Authentication Middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 'student_123', role: 'mahasiswa' };
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

// Mock Database Pool
const pool = require('../config/db');
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

// Prevent port conflict if tests run parallelly
afterAll((done) => {
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

describe('Gamification API Unit & Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/coins/earn', () => {
    test('should reject negative coin amounts (Validation Boundary)', async () => {
      const res = await request(app)
        .post('/api/coins/earn')
        .send({ amount: -50, reason: 'Hacked' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Jumlah koin tidak valid');
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('should reject missing amount or reason', async () => {
      const res = await request(app)
        .post('/api/coins/earn')
        .send({ amount: 100 }); // Missing reason
      
      expect(res.status).toBe(400);
      expect(pool.query).not.toHaveBeenCalled();
    });

    test('should successfully add coins and record transaction', async () => {
      pool.query
        .mockResolvedValueOnce({}) // UPDATE users
        .mockResolvedValueOnce({}) // INSERT transaction
        .mockResolvedValueOnce({ rows: [{ coins: 150 }] }); // SELECT new balance

      const res = await request(app)
        .post('/api/coins/earn')
        .send({ amount: 100, reason: 'Quiz Level 1' });
      
      expect(res.status).toBe(200);
      expect(res.body.coins).toBe(150);
      expect(pool.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('POST /api/coins/spend', () => {
    test('should reject if balance is insufficient', async () => {
      // Mock user has 50 coins
      pool.query.mockResolvedValueOnce({ rows: [{ coins: 50 }] });

      const res = await request(app)
        .post('/api/coins/spend')
        .send({ amount: 1000, reason: 'Buy RTX 3060' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Koin tidak cukup!');
    });

    test('should deduct coins if balance is sufficient', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ coins: 1500 }] }) // CHECK balance
        .mockResolvedValueOnce({}) // UPDATE
        .mockResolvedValueOnce({}) // INSERT transaction
        .mockResolvedValueOnce({ rows: [{ coins: 500 }] }); // SELECT new balance

      const res = await request(app)
        .post('/api/coins/spend')
        .send({ amount: 1000, reason: 'Buy CPU' });
      
      expect(res.status).toBe(200);
      expect(res.body.coins).toBe(500);
    });
  });

  describe('POST /api/daily-login', () => {
    test('should give 50 coins and streak 1 on first ever login', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // not claimed today
        .mockResolvedValueOnce({ rows: [] }) // no streak yesterday
        .mockResolvedValueOnce({}) // insert login
        .mockResolvedValueOnce({}) // update coins
        .mockResolvedValueOnce({}) // insert transaction
        .mockResolvedValueOnce({ rows: [{ coins: 50 }] }); // select new balance

      const res = await request(app).post('/api/daily-login');
      
      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(1);
      expect(res.body.coins_earned).toBe(50);
    });

    test('should return already claimed if logged in twice on same day', async () => {
      pool.query.mockResolvedValueOnce({ 
        rows: [{ streak: 1, coins_earned: 50 }] 
      });

      const res = await request(app).post('/api/daily-login');
      
      expect(res.status).toBe(200);
      expect(res.body.already_claimed).toBe(true);
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    test('should calculate streak cycle properly (Day 7 rewards)', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] }) // not claimed today
        .mockResolvedValueOnce({ rows: [{ streak: 6 }] }) // streak 6 yesterday
        .mockResolvedValueOnce({}) // insert login
        .mockResolvedValueOnce({}) // update coins
        .mockResolvedValueOnce({}) // insert transaction
        .mockResolvedValueOnce({ rows: [{ coins: 200 }] }); // select new balance

      const res = await request(app).post('/api/daily-login');
      
      expect(res.status).toBe(200);
      expect(res.body.streak).toBe(7);
      expect(res.body.coins_earned).toBe(200); // Day 7 reward is 200
    });
  });

  describe('POST /api/pc-quest/buy', () => {
    test('should reject non-existent component', async () => {
      const res = await request(app)
        .post('/api/pc-quest/buy')
        .send({ component_id: 'fake_gpu' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('tidak ditemukan');
    });

    test('should reject if component already owned', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Already owned

      const res = await request(app)
        .post('/api/pc-quest/buy')
        .send({ component_id: 'cpu_intel_i5_10400' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Komponen sudah dimiliki!');
    });
  });
});
