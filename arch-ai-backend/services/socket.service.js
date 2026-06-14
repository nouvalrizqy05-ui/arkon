/**
 * ARKON Socket.io Service — Extracted from server.js
 * 
 * Handles all real-time WebSocket events including:
 * - Room join/leave with online count tracking
 * - Lecturer broadcast actions (polls, quiz control)
 * - Study Group collaboration (notes, chat, typing indicators)
 * - Live Quiz question streaming
 * - Tournament duel events
 * - Work lock/unlock for Dosen review
 * 
 * Security: JWT authentication middleware applied to all socket connections.
 */

const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * TASK-SEC-003: Verify user is a member of the specified room
 * Used for per-event authorization on sensitive socket events
 */
async function verifyRoomMembership(userId, roomId) {
  if (!userId || !roomId) return false;
  try {
    // Check if user is the room owner (dosen) or a class member
    const result = await pool.query(
      `SELECT 1 FROM rooms WHERE id = $1 AND (dosen_id = $2 OR owner_id = $2)
       UNION
       SELECT 1 FROM class_members WHERE room_id = $1 AND student_id = $2
       LIMIT 1`,
      [roomId, userId]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

/**
 * Initialize Socket.io with JWT authentication and all event handlers
 * @param {import('socket.io').Server} io - Socket.io server instance
 * @param {Map} roomOnlineUsers - Room online tracking map
 * @param {Map} sgOnlineUsers - Study group online tracking map
 * @param {Map} pollState - Poll state tracking map
 */
function initializeSocketHandlers(io, roomOnlineUsers, sgOnlineUsers, pollState) {
  
  // ──────────────────────────────────────────
  // SECURITY: JWT Authentication Middleware
  // ──────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ||
                  socket.handshake.headers?.authorization?.split(' ')[1];
    
    if (!token) {
      console.warn('⚠️ [Socket Auth] Connection rejected — no token provided');
      return next(new Error('Authentication required'));
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      console.warn('⚠️ [Socket Auth] Connection rejected — invalid token:', err.message);
      next(new Error('Invalid or expired token'));
    }
  });

  // ──────────────────────────────────────────
  // CONNECTION HANDLER
  // ──────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`📡 [Socket] User Connected: ${socket.id} (userId: ${socket.user?.id}, role: ${socket.user?.role})`);

    // ── Room Join (with membership verification) ──
    socket.on('join-room', async (roomId) => {
      // TASK-SEC-003: Verify membership before allowing room join
      const isMember = await verifyRoomMembership(socket.user?.id, roomId);
      if (!isMember) {
        socket.emit('auth:error', { message: 'Anda bukan anggota room ini.', event: 'join-room' });
        console.warn(`⚠️ [Socket] User ${socket.user?.id} rejected from room ${roomId} — not a member`);
        return;
      }

      socket.join(roomId);
      socket.currentRoom = roomId;
      
      // Track online count
      if (!roomOnlineUsers.has(roomId)) roomOnlineUsers.set(roomId, new Set());
      roomOnlineUsers.get(roomId).add(socket.id);
      io.to(roomId).emit('room:online-count', roomOnlineUsers.get(roomId).size);
      console.log(`📡 [Socket] User ${socket.id} joined room ${roomId} (online: ${roomOnlineUsers.get(roomId).size})`);
    });

    // ── Lecturer Broadcast Actions ──
    socket.on('lecturer-action', (data) => {
      if (socket.user?.role !== 'dosen') return;
      socket.to(data.roomId).emit('student-receive-action', data);
      console.log(`📢 [Broadcast] ${data.type || data.action} → Room ${data.roomId}`);
    });

    socket.on('broadcast:start', (data) => {
      if (socket.user?.role !== 'dosen') return;
      socket.to(data.roomId).emit('broadcast:start', { message: data.message });
      console.log(`📢 [Broadcast Message] Room ${data.roomId}: ${data.message}`);
    });

    // ── Poll System ──
    socket.on('broadcast:poll', (data) => {
      if (socket.user?.role !== 'dosen') return;
      const { roomId, question, options = ['Paham', 'Belum'] } = data;
      
      const votes = {};
      options.forEach(opt => { votes[opt] = new Set(); });

      pollState.set(roomId, { question, options, votes });
      socket.to(roomId).emit('student-receive-action', { type: 'poll', question, options, roomId });
    });

    socket.on('broadcast:poll-vote', (data) => {
      const { roomId, studentId, vote } = data;
      const poll = pollState.get(roomId);
      if (!poll) return;
      
      // Remove previous vote
      Object.keys(poll.votes).forEach(key => poll.votes[key].delete(studentId));
      // Add new vote
      if (poll.votes[vote]) {
        poll.votes[vote].add(studentId);
      }

      const results = {};
      let total = 0;
      Object.keys(poll.votes).forEach(key => {
        const count = poll.votes[key].size;
        results[key] = count;
        total += count;
      });

      io.to(roomId).emit('poll:results', { question: poll.question, options: poll.options, results, total });
    });

    socket.on('broadcast:poll-close', (data) => {
      if (socket.user?.role !== 'dosen') return;
      pollState.delete(data.roomId);
      io.to(data.roomId).emit('poll:closed');
    });

    // ── Work Lock/Unlock (Dosen reviewing student work) ──
    socket.on('work:lock', (data) => {
      if (socket.user?.role !== 'dosen') return;
      const { roomId, workId, dosenName } = data;
      socket.to(roomId).emit('work:locked', { workId, dosenName });
      console.log(`🔒 [Tinker] Dosen ${dosenName} locked work ${workId} in room ${roomId}`);
    });

    socket.on('work:unlock', (data) => {
      if (socket.user?.role !== 'dosen') return;
      const { roomId, workId } = data;
      socket.to(roomId).emit('work:unlocked', { workId });
      console.log(`🔓 [Tinker] Work ${workId} unlocked in room ${roomId}`);
    });

    // ── Live Quiz Events ──
    socket.on('quiz:start', (data) => {
      if (socket.user?.role !== 'dosen') return;
      socket.to(data.roomId).emit('quiz:start', data);
      console.log(`🎮 [Quiz] Session started in room ${data.roomId}`);
    });

    socket.on('quiz:question', (data) => {
      if (socket.user?.role !== 'dosen') return;
      // Server-authoritative timer
      const endsAt = Date.now() + (data.duration_seconds * 1000);
      socket.to(data.roomId).emit('quiz:question', { ...data, endsAt });
      // Also send back to dosen
      socket.emit('quiz:question-ack', { endsAt });
    });

    socket.on('quiz:reveal', (data) => {
      if (socket.user?.role !== 'dosen') return;
      io.to(data.roomId).emit('quiz:reveal', data);
    });

    socket.on('quiz:end', (data) => {
      if (socket.user?.role !== 'dosen') return;
      io.to(data.roomId).emit('quiz:end', data);
      console.log(`🏁 [Quiz] Session ended in room ${data.roomId}`);
    });

    // ── Study Group Events ──
    socket.on('sg:join', async ({ groupId, studentId, studentName }) => {
      const roomName = `sg:${groupId}`;
      socket.join(roomName);
      socket.currentSG = groupId;
      socket.studentId = studentId;

      if (!sgOnlineUsers.has(groupId)) sgOnlineUsers.set(groupId, new Map());
      sgOnlineUsers.get(groupId).set(studentId, { socketId: socket.id, studentName });

      // Send current members list
      const memberList = Array.from(sgOnlineUsers.get(groupId).entries()).map(([sId, m]) => ({ 
        student_id: sId, 
        student_name: m.studentName 
      }));
      io.to(roomName).emit('sg:member-update', memberList);

      // Fetch current notes from DB and send to the joining user
      try {
        const group = await pool.query('SELECT current_notes FROM study_groups WHERE id = $1', [groupId]);
        if (group.rows.length > 0) {
          socket.emit('sg:note-update', group.rows[0].current_notes);
        }
      } catch (err) { console.error(err); }

      socket.to(roomName).emit('sg:message', {
        student_id: 'system',
        student_name: 'System',
        content: `${studentName} bergabung ke diskusi.`,
        message_type: 'system',
        created_at: new Date()
      });
    });

    socket.on('sg:leave', ({ groupId, studentId }) => {
      const roomName = `sg:${groupId}`;
      socket.leave(roomName);
      if (sgOnlineUsers.has(groupId)) {
        sgOnlineUsers.get(groupId).delete(studentId);
        const memberList = Array.from(sgOnlineUsers.get(groupId).entries()).map(([sId, m]) => ({ 
          student_id: sId, 
          student_name: m.studentName 
        }));
        io.to(roomName).emit('sg:member-update', memberList);
      }
    });

    socket.on('sg:note-update', async ({ groupId, content }) => {
      socket.to(`sg:${groupId}`).emit('sg:note-update', content);
      // Persist notes to DB
      try {
        await pool.query('UPDATE study_groups SET current_notes = $1 WHERE id = $2', [content, groupId]);
      } catch (err) { console.error(err); }
    });

    socket.on('sg:typing', ({ groupId, studentName, isTyping }) => {
      socket.to(`sg:${groupId}`).emit('sg:typing', { studentName, isTyping });
    });

    // ── Disconnect Cleanup ──
    socket.on('disconnect', () => {
      // Room cleanup
      if (socket.currentRoom && roomOnlineUsers.has(socket.currentRoom)) {
        roomOnlineUsers.get(socket.currentRoom).delete(socket.id);
        const count = roomOnlineUsers.get(socket.currentRoom).size;
        io.to(socket.currentRoom).emit('room:online-count', count);
        if (count === 0) roomOnlineUsers.delete(socket.currentRoom);
      }

      // Study Group cleanup
      if (socket.currentSG && sgOnlineUsers.has(socket.currentSG)) {
        const groupId = socket.currentSG;
        sgOnlineUsers.get(groupId).delete(socket.studentId);
        const memberList = Array.from(sgOnlineUsers.get(groupId).entries()).map(([sId, m]) => ({ 
          student_id: sId, 
          student_name: m.studentName 
        }));
        io.to(`sg:${groupId}`).emit('sg:member-update', memberList);
        if (sgOnlineUsers.get(groupId).size === 0) sgOnlineUsers.delete(groupId);
      }
      console.log('📡 [Socket] User Disconnected:', socket.id);
    });
  });
}

module.exports = { initializeSocketHandlers };
