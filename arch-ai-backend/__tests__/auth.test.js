const request = require('supertest');

// Mock database pool
jest.mock('../config/db', () => ({
  query: jest.fn((text, params) => {
    if (text.includes('INSERT INTO users')) {
      return Promise.resolve({
        rows: [{
          id: 1,
          full_name: params[0],
          identifier_number: params[1],
          email: params[2],
          role: params[3]
        }]
      });
    }
    // Default return for SELECT queries
    return Promise.resolve({ rows: [] });
  })
}));

const { app } = require('../server');

describe('Authentication API Integration Tests', () => {

  test('POST /api/register - should create a new user', async () => {
    const testUser = {
      full_name: 'Test Student',
      identifier_number: 'TEST' + Date.now(),
      email: `test${Date.now()}@example.com`,
      role: 'mahasiswa',
      password: 'Password123!'
    };

    const res = await request(app)
      .post('/api/register')
      .send(testUser);

    const data = res.body;
    expect(res.status).toBe(201);
    expect(data.message).toContain('Registrasi berhasil!');
    expect(data.user.identifier_number).toBe(testUser.identifier_number);
  });

  test('POST /api/login - should fail with wrong credentials', async () => {
    const loginData = {
      identifier_number: 'NONEXISTENT',
      password: 'wrongpassword'
    };

    const res = await request(app)
      .post('/api/login')
      .send(loginData);

    const data = res.body;
    expect(res.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  test('POST /api/forgot-password - should handle recovery request', async () => {
    const res = await request(app)
      .post('/api/forgot-password')
      .send({ identifier_number: '12345' });

    const data = res.body;
    expect(res.status).toBe(200);
    expect(data.message).toContain('email instruksi akan dikirim');
  });
});
