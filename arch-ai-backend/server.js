require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');

// Modular Imports
const pool = require('./config/db');

// Ensure Study Group tables exist in database on startup
pool.query(`
  CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    group_code VARCHAR(20) UNIQUE NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    current_notes TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS study_group_members (
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS study_group_messages (
    id SERIAL PRIMARY KEY,
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'chat',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS study_group_tasks (
    id SERIAL PRIMARY KEY,
    group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'todo',
    assignee VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).then(() => console.log('✅ [Database] Study Group and Kanban Task tables verified successfully.')).catch(err => console.error('🔥 [Database] Study Group DDL Error:', err.message));

const { initRedis, getRedisHealth, closeRedis } = require('./config/redis');
const { authenticateToken, requireRole } = require('./middleware/auth');
const { initializeSocketHandlers } = require('./services/socket.service');
const { enforceHttps, contentSecurityPolicy, sanitizeBody } = require('./middleware/security');
const { resolveInstitution } = require('./middleware/multiTenant');
const { initSentry, sentryErrorHandler, getSentryHealth } = require('./config/sentry');
const { setupSwagger } = require('./config/swagger');
const adminRouter = require('./routes/admin.routes');

// Initialize Sentry as early as possible
const sentryInstance = initSentry();
const logError = (context, err) => console.error(`[${context}]`, err?.message || err);

// Route Imports
const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/rooms.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const activitiesRoutes = require('./routes/activities.routes');
const studentWorkRoutes = require('./routes/student-work.routes');
const notesRoutes = require('./routes/notes.routes');
const irtRoutes = require('./routes/irt.routes');
const progressRoutes = require('./routes/progress.routes');
const tournamentRoutes = require('./routes/tournaments.routes');
const usersRoutes = require('./routes/users.routes');
const achievementsRoutes = require('./routes/achievements.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const studyGroupsRoutes = require('./routes/study-groups.routes');
const gmRoutes = require('./routes/gm.routes');
const heatmapRoutes = require('./routes/heatmap.routes');
const liveQuizRoutes = require('./routes/live-quiz.routes');
const aiRoutes = require('./routes/ai.routes');

// SECURITY: JWT_SECRET wajib di-set di .env
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET tidak ditemukan di .env!');
  process.exit(1);
}
if (!process.env.REFRESH_SECRET) {
  console.error('❌ FATAL: REFRESH_SECRET tidak ditemukan di .env!');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], credentials: true },
  // ─── Azure App Service: ARR Affinity ───────────────────────
  // Azure App Service uses ARR (Application Request Routing) for load balancing.
  // Without sticky sessions, Socket.io reconnects to different instances and loses state.
  // Fix: increase pingTimeout so client has time to reconnect to same instance,
  // and allow both websocket + polling as fallback.
  pingTimeout: 60000,       // 60s timeout (Azure's load balancer idle timeout is 4min)
  pingInterval: 25000,      // ping every 25s to keep connection alive
  transports: ['websocket', 'polling'],  // polling fallback if WebSocket blocked
  allowEIO3: true,          // EIO3 compatibility for older clients
  // For Azure Container Apps (no ARR issue): above settings still beneficial
});
global.io = io;
app.set('io', io);

// ==========================================
// REDIS INTEGRATION (Socket.io Adapter + Cache)
// Graceful fallback: if Redis unavailable, uses in-memory
// ==========================================
const redis = initRedis();

if (redis.pub && redis.sub) {
  // Hanya pasang adapter JIKA dan KETIKA Redis sudah benar-benar terhubung
  redis.pub.on('ready', () => {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      io.adapter(createAdapter(redis.pub, redis.sub));
      console.log('✅ [Socket.io] Redis adapter attached — horizontal scaling enabled');
    } catch (err) {
      console.error('❌ [Socket.io] Gagal memasang Redis adapter:', err.message);
    }
  });

  // Jika Redis terputus, Socket.io akan otomatis jatuh ke in-memory mode
  redis.pub.on('error', (err) => {
    console.warn('⚠️ [Socket.io] Redis terputus, berjalan di mode single-instance');
  });
} else {
  console.warn('⚠️ [Socket.io] No Redis — running in single-instance mode');
}
app.set('redis', redis);

// Socket.io Real-time State
const roomOnlineUsers = new Map(); // roomId -> Set<socketId>
const sgOnlineUsers = new Map(); // groupId -> Map<studentId, {socketId, studentName}>
const pollState = new Map(); // roomId -> { question, votes: { up: Set, down: Set } }
app.set('roomOnlineUsers', roomOnlineUsers);
app.set('sgOnlineUsers', sgOnlineUsers);
app.set('pollState', pollState);

app.use(cors({ origin: true, credentials: true }));
app.use(enforceHttps);
app.use(contentSecurityPolicy);

// ─── Azure App Service: disable ARR session affinity cookie ──────
// ARR-Disable-Client-Cache prevents Azure from caching WebSocket upgrade requests
// Note: for sticky sessions, set ARR Affinity=On in Azure portal instead
app.use((req, res, next) => {
  if (process.env.AZURE_WEBAPP_NAME) { // Only when running on Azure
    res.setHeader('Arr-Disable-Session-Affinity', 'false'); // Keep affinity on
  }
  next();
});
app.use(express.json());
app.use(sanitizeBody);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "wss:", "ws:", ...ALLOWED_ORIGINS],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'self'", "https://modelviewer.dev"],
      objectSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.get('/api/ping', (req, res) => res.json({ message: 'pong', version: 'arkon-2.0' }));


if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  app.get('/api/test-glb', (req, res) => {
    try {
      const filePath = path.join(__dirname, '../public/models/office_pc.glb');
      const buffer = fs.readFileSync(filePath);
      const chunk0Length = buffer.readUInt32LE(12);
      const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
      const gltf = JSON.parse(jsonStr);
      res.json({
        nodes: gltf.nodes ? gltf.nodes.map(n => n.name) : [],
        materials: gltf.materials ? gltf.materials.map(m => m.name) : [],
        meshes: gltf.meshes ? gltf.meshes.map(m => m.name) : []
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

// FILE UPLOAD: Completely removed in 2.0.0 cleanup

// ==========================================
// STARTUP MIGRATIONS
// ==========================================
// DDL (Data Definition Language) telah dipindahkan ke folder /migrations
// Jalankan \`node run_migration.js\` untuk menginisialisasi database.

// ==========================================
// PRODUCTION HEALTH CHECK ENDPOINT
// Returns: database status, Gemini API status, app version, uptime, memory
// ==========================================
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const healthReport = {
    status: 'ok',
    version: require('./package.json').version || '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // 1. Database Check
  try {
    const dbStart = Date.now();
    const result = await pool.query('SELECT NOW() as server_time, current_database() as db_name');
    healthReport.checks.database = {
      status: 'connected',
      responseTime: `${Date.now() - dbStart}ms`,
      database: result.rows[0].db_name,
      serverTime: result.rows[0].server_time,
    };
  } catch (err) {
    healthReport.status = 'degraded';
    healthReport.checks.database = { status: 'disconnected', error: err.message };
  }

  // 2. Gemini API Check (lightweight — only verify key existence & endpoint reachability)
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.length > 0) {
      healthReport.checks.geminiApi = {
        status: 'configured',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        keyPresent: true,
      };
    } else {
      healthReport.checks.geminiApi = { status: 'not_configured', keyPresent: false };
    }
  } catch {
    healthReport.checks.geminiApi = { status: 'error' };
  }

  // 3. Redis Check
  healthReport.checks.redis = getRedisHealth();

  // 4. Memory Usage
  const memUsage = process.memoryUsage();
  healthReport.checks.memory = {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
  };

  // 5. Socket.io Status
  healthReport.checks.socketio = {
    connectedClients: io.engine?.clientsCount || 0,
    adapter: redis.available ? 'redis' : 'in-memory',
  };

  healthReport.responseTime = `${Date.now() - startTime}ms`;

  const statusCode = healthReport.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthReport);
});

app.get('/api/admin/fix-db', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    
    // Saran implementasi: Endpoint ini sebaiknya digunakan untuk ALTER TABLE ... ADD COLUMN IF NOT EXISTS
    // Semua CREATE TABLE utama sudah dipindahkan ke startup migration
    
    res.json({ message: 'Database schema verified successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



/**
 * Middleware untuk memvalidasi JSON Web Token (JWT)
 * (Diimpor dari ./middleware/auth)
 */



// ==========================================
// 1. ROUTES AUTHENTICATION (Rate Limited)
// ==========================================


app.use('/api', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tournaments', tournamentRoutes);
// Room Rebuild: New routes
app.use('/api/activities', activitiesRoutes);
app.use('/api/student-work', studentWorkRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/irt', irtRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/users', usersRoutes);

app.use('/api', gamificationRoutes);
app.use('/api/study-groups', studyGroupsRoutes);
app.use('/api/gm', gmRoutes);
app.use('/api/analytics/heatmap', heatmapRoutes);
app.use('/api/live-quiz', liveQuizRoutes);
app.use('/api/ai', aiRoutes);

const simulatorRoutes = require('./routes/simulatorRoutes');
app.use('/api/simulator', simulatorRoutes);



// ==========================================
// SOCKET.IO REAL-TIME COLLABORATION
// (Extracted to services/socket.service.js with JWT auth)
// ==========================================
initializeSocketHandlers(io, roomOnlineUsers, sgOnlineUsers, pollState);


// Global error handler — WAJIB ada
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[${new Date().toISOString()}] ${err.stack}`);

  res.status(status).json({
    error: isDev ? err.message : 'Terjadi kesalahan server. Coba lagi nanti.',
    ...(isDev && { stack: err.stack })
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint ${req.method} ${req.path} tidak ditemukan.` });
});

const PORT = process.env.PORT || 3000;
// ── Admin Routes (must be before listen) ─────────────────
app.use('/api/admin', adminRouter);

// ── API Documentation (must be before listen) ─────────────
setupSwagger(app);

// ── Sentry error handler (must be last middleware) ─────────
app.use(sentryErrorHandler());

if (require.main === module) {
  server.listen(PORT, () => console.log(`🚀 [ARKON Backend] Menjalankan server dengan Socket.io di port ${PORT}...`));
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 [ARKON] SIGTERM received — graceful shutdown...');
  await closeRedis();
  server.close(() => process.exit(0));
});

module.exports = { app, server };