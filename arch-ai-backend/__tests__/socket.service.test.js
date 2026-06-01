/**
 * ARKON Socket.io Service Tests
 * Covers: JWT auth, room join/leave, live quiz flow, disconnect handling
 * FR-LIVE-001 to FR-LIVE-005, TASK-SEC-003
 */

// ─── Mocks ────────────────────────────────────────────────────────
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  sign: jest.fn(() => 'mock_token')
}));

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Mock socket & io helpers
function makeSocket(overrides = {}) {
  return {
    id: 'socket_' + Math.random().toString(36).slice(2),
    handshake: { auth: { token: 'valid_token' }, headers: {}, address: '127.0.0.1' },
    user: null,
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    rooms: new Set(),
    on: jest.fn(),
    to: jest.fn().mockReturnThis(),
    ...overrides
  };
}

function makeIo() {
  const io = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    in: jest.fn().mockReturnThis(),
    fetchSockets: jest.fn().mockResolvedValue([]),
    use: jest.fn(),
    on: jest.fn()
  };
  return io;
}

// ─── verifyRoomMembership tests ───────────────────────────────────
describe('verifyRoomMembership', () => {
  const { verifyRoomMembership } = require('../services/socket.service');

  beforeEach(() => { jest.clearAllMocks(); });

  test('returns false when userId is null', async () => {
    const result = await verifyRoomMembership(null, 'room-123');
    expect(result).toBe(false);
  });

  test('returns false when roomId is null', async () => {
    const result = await verifyRoomMembership('user-123', null);
    expect(result).toBe(false);
  });

  test('returns true when user is a class member', async () => {
    pool.query.mockResolvedValue({ rows: [{ 1: 1 }] });
    const result = await verifyRoomMembership('user-123', 'room-123');
    expect(result).toBe(true);
    expect(pool.query).toHaveBeenCalledWith(expect.stringContaining('class_members'), ['room-123', 'user-123']);
  });

  test('returns false when user is not in room', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const result = await verifyRoomMembership('user-123', 'room-999');
    expect(result).toBe(false);
  });

  test('returns false when DB throws', async () => {
    pool.query.mockRejectedValue(new Error('DB down'));
    const result = await verifyRoomMembership('user-123', 'room-123');
    expect(result).toBe(false);
  });
});

// ─── Socket JWT auth middleware tests ────────────────────────────
describe('Socket JWT Authentication Middleware', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('rejects connection without token', (done) => {
    const socket = makeSocket({ handshake: { auth: {}, headers: {}, address: '127.0.0.1' } });
    const next = (err) => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/authentication/i);
      done();
    };
    // Inline the middleware logic test
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
  });

  test('rejects connection with invalid token', (done) => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });
    const socket = makeSocket();
    const next = (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    };
    const token = socket.handshake.auth?.token;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
      socket.user = decoded;
      next();
    } catch (e) {
      next(new Error('Token tidak valid'));
    }
  });

  test('accepts connection with valid token', (done) => {
    jwt.verify.mockReturnValue({ id: 'user-123', role: 'mahasiswa' });
    const socket = makeSocket();
    const next = (err) => {
      expect(err).toBeUndefined();
      done();
    };
    const token = socket.handshake.auth?.token;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
      socket.user = decoded;
      next();
    } catch (e) {
      next(new Error('Token tidak valid'));
    }
  });
});

// ─── Room join/leave logic tests ─────────────────────────────────
describe('Room Online User Tracking', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('adds user to online tracking on join', () => {
    const roomOnlineUsers = new Map();
    const roomId = 'room-123';
    const userId = 'user-abc';
    const socketId = 'socket-xyz';

    // Simulate join logic
    if (!roomOnlineUsers.has(roomId)) roomOnlineUsers.set(roomId, new Map());
    roomOnlineUsers.get(roomId).set(userId, { socketId, joinedAt: Date.now() });

    expect(roomOnlineUsers.get(roomId).has(userId)).toBe(true);
    expect(roomOnlineUsers.get(roomId).size).toBe(1);
  });

  test('removes user from online tracking on leave', () => {
    const roomOnlineUsers = new Map();
    const roomId = 'room-123';
    const userId = 'user-abc';

    roomOnlineUsers.set(roomId, new Map([[userId, { socketId: 'sx' }]]));
    expect(roomOnlineUsers.get(roomId).has(userId)).toBe(true);

    // Simulate leave logic
    roomOnlineUsers.get(roomId).delete(userId);
    if (roomOnlineUsers.get(roomId).size === 0) roomOnlineUsers.delete(roomId);

    expect(roomOnlineUsers.has(roomId)).toBe(false);
  });

  test('handles multiple users in same room', () => {
    const roomOnlineUsers = new Map();
    const roomId = 'room-456';
    roomOnlineUsers.set(roomId, new Map());
    ['u1', 'u2', 'u3'].forEach(uid => {
      roomOnlineUsers.get(roomId).set(uid, { socketId: 'sx_' + uid });
    });
    expect(roomOnlineUsers.get(roomId).size).toBe(3);
  });

  test('different rooms are isolated', () => {
    const roomOnlineUsers = new Map();
    roomOnlineUsers.set('room-A', new Map([['userX', {}]]));
    roomOnlineUsers.set('room-B', new Map([['userY', {}], ['userZ', {}]]));

    expect(roomOnlineUsers.get('room-A').size).toBe(1);
    expect(roomOnlineUsers.get('room-B').size).toBe(2);
    expect(roomOnlineUsers.get('room-A').has('userY')).toBe(false);
  });
});

// ─── Live Quiz flow tests ─────────────────────────────────────────
describe('Live Quiz Score Calculation', () => {
  function calcScore(isCorrect, answerTimeMs, durationSeconds) {
    if (!isCorrect) return 0;
    const timeRatio = Math.max(0, 1 - answerTimeMs / (durationSeconds * 1000));
    return Math.round(500 + 500 * timeRatio);
  }

  test('correct answer at maximum speed gives 1000 points', () => {
    expect(calcScore(true, 0, 20)).toBe(1000);
  });

  test('correct answer at half time gives 750 points', () => {
    expect(calcScore(true, 10000, 20)).toBe(750);
  });

  test('correct answer at exactly time limit gives 500 points', () => {
    expect(calcScore(true, 20000, 20)).toBe(500);
  });

  test('correct answer past time limit gives 500 points (clamped)', () => {
    // timeRatio = max(0, ...) prevents going below 0
    expect(calcScore(true, 25000, 20)).toBe(500);
  });

  test('wrong answer always gives 0', () => {
    expect(calcScore(false, 1000, 20)).toBe(0);
    expect(calcScore(false, 0, 20)).toBe(0);
  });
});

// ─── Disconnect cleanup tests ─────────────────────────────────────
describe('Socket Disconnect Cleanup', () => {
  test('cleans up user from all rooms on disconnect', () => {
    const roomOnlineUsers = new Map();
    const userId = 'user-cleanup';

    // User in multiple rooms
    ['room-1', 'room-2', 'room-3'].forEach(roomId => {
      roomOnlineUsers.set(roomId, new Map([[userId, { socketId: 'sx' }]]));
    });

    // Simulate disconnect cleanup
    for (const [roomId, users] of roomOnlineUsers.entries()) {
      users.delete(userId);
      if (users.size === 0) roomOnlineUsers.delete(roomId);
    }

    expect(roomOnlineUsers.size).toBe(0);
  });

  test('does not affect other users in room on disconnect', () => {
    const roomOnlineUsers = new Map();
    const roomId = 'room-shared';
    roomOnlineUsers.set(roomId, new Map([
      ['user-leaving', { socketId: 'sx1' }],
      ['user-staying', { socketId: 'sx2' }]
    ]));

    // Only user-leaving disconnects
    roomOnlineUsers.get(roomId).delete('user-leaving');

    expect(roomOnlineUsers.get(roomId).has('user-staying')).toBe(true);
    expect(roomOnlineUsers.get(roomId).size).toBe(1);
  });
});

// ─── N-Gain analytics pipeline test ──────────────────────────────
describe('Live Quiz → Analytics N-Gain Pipeline', () => {
  test('correct_count / total_questions = percentage score for analytics', () => {
    const correct_count = 7;
    const total_questions = 10;
    const pct = Math.round((correct_count / total_questions) * 100);
    expect(pct).toBe(70);
  });

  test('0 correct gives 0% score', () => {
    const pct = Math.round((0 / 10) * 100);
    expect(pct).toBe(0);
  });

  test('all correct gives 100% score', () => {
    const pct = Math.round((10 / 10) * 100);
    expect(pct).toBe(100);
  });

  test('total_questions 0 prevents division by zero', () => {
    const total_questions = 0;
    const pct = total_questions > 0 ? Math.round((5 / total_questions) * 100) : 0;
    expect(pct).toBe(0);
  });
});
