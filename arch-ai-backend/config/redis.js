/**
 * ARKON Redis Configuration — TASK-PERF-001
 * 
 * Provides Redis connection for:
 * - Socket.io adapter (horizontal scaling)
 * - Leaderboard caching (30s TTL)
 * - Session management (future)
 * 
 * Graceful fallback: if Redis unavailable, app still works
 * with in-memory state (single-instance mode).
 * 
 * Satisfies: NFR-SCALE-001, NFR-SCALE-002
 * 
 * Azure Fix: lazyConnect: false agar koneksi langsung dibuat saat startup
 *            sehingga health check bisa membaca status yang benar.
 */

let Redis;
try {
  Redis = require('ioredis');
} catch {
  Redis = null;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL) || 30;

const isAzureRedis = REDIS_URL.includes('redis.cache.windows.net');

let redisClient = null;
let redisPub = null;
let redisSub = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connections
 * Returns { client, pub, sub, available }
 */
function initRedis() {
  if (!Redis) {
    console.warn('⚠️ [Redis] ioredis not installed — running in single-instance mode');
    return { client: null, pub: null, sub: null, available: false };
  }

  if (!process.env.REDIS_URL) {
    console.warn('⚠️ [Redis] REDIS_URL tidak diset di .env — berjalan di mode single-instance (in-memory fallback)');
    return { client: null, pub: null, sub: null, available: false };
  }

  try {
    const commonOptions = {
      tls: isAzureRedis ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        // Berhenti retry setelah 5x saat startup agar tidak hang terlalu lama
        if (times > 5) {
          console.error('❌ [Redis] Max retries reached, giving up');
          return null;
        }
        const delay = Math.min(times * 500, 3000);
        console.warn(`⚠️ [Redis] Retrying connection in ${delay}ms (attempt ${times})`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      // FIX: false agar koneksi langsung dibuat saat initRedis() dipanggil
      // sehingga isRedisAvailable bisa di-set true sebelum health check pertama
      lazyConnect: false,
      enableReadyCheck: true,
      connectTimeout: 10000,  // 10 detik timeout koneksi (Azure bisa lambat)
    };

    redisClient = new Redis(REDIS_URL, { ...commonOptions, keyPrefix: 'arkon:' });
    redisPub = new Redis(REDIS_URL, commonOptions);
    redisSub = new Redis(REDIS_URL, commonOptions);

    // Event handlers — update isRedisAvailable secara real-time
    redisClient.on('ready', () => {
      console.log('✅ [Redis] Connected and ready');
      isRedisAvailable = true;
    });

    redisClient.on('connect', () => {
      console.log('✅ [Redis] Connection established');
    });

    redisClient.on('error', (err) => {
      console.error('❌ [Redis] Connection error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.warn('⚠️ [Redis] Connection closed');
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      console.warn('⚠️ [Redis] Reconnecting...');
      isRedisAvailable = false;
    });

    redisPub.on('error', () => { /* Suppress unhandled error crash */ });
    redisSub.on('error', () => { /* Suppress unhandled error crash */ });

    // Dengan lazyConnect: false, koneksi sudah berjalan di background
    // Tidak perlu await di sini — event 'ready' akan update isRedisAvailable
    return { client: redisClient, pub: redisPub, sub: redisSub, available: true };

  } catch (err) {
    console.error('❌ [Redis] Initialization failed:', err.message);
    return { client: null, pub: null, sub: null, available: false };
  }
}

/**
 * Cache helper: get from Redis, fallback to callback
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to call on cache miss
 * @param {number} ttl - TTL in seconds (default: 30)
 */
async function cacheGet(key, fetchFn, ttl = CACHE_TTL) {
  if (!isRedisAvailable || !redisClient) {
    return fetchFn();
  }

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const fresh = await fetchFn();
    // Don't await cache set — fire and forget
    redisClient.setex(key, ttl, JSON.stringify(fresh)).catch(() => { });
    return fresh;
  } catch {
    // Redis error — fallback to direct fetch
    return fetchFn();
  }
}

/**
 * Invalidate a cache key
 */
async function cacheInvalidate(key) {
  if (!isRedisAvailable || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch {
    // Ignore cache invalidation errors
  }
}

/**
 * Invalidate all keys matching a pattern
 */
async function cacheInvalidatePattern(pattern) {
  if (!isRedisAvailable || !redisClient) return;
  try {
    const keys = await redisClient.keys(`arkon:${pattern}`);
    if (keys.length > 0) {
      // Remove prefix since keyPrefix auto-adds it
      const cleanKeys = keys.map(k => k.replace('arkon:', ''));
      await redisClient.del(...cleanKeys);
    }
  } catch {
    // Ignore
  }
}

/**
 * Get Redis health status for /api/health
 */
function getRedisHealth() {
  if (!Redis) {
    return { status: 'not_installed', message: 'ioredis package not found' };
  }
  if (!isRedisAvailable || !redisClient) {
    return { status: 'disconnected', message: 'Redis not available — single-instance mode' };
  }
  return {
    status: 'connected',
    url: REDIS_URL.replace(/\/\/.*@/, '//***@'), // mask credentials
  };
}

/**
 * Graceful shutdown
 */
async function closeRedis() {
  const clients = [redisClient, redisPub, redisSub].filter(Boolean);
  await Promise.all(clients.map(c => c.quit().catch(() => c.disconnect())));
  isRedisAvailable = false;
}

module.exports = {
  initRedis,
  cacheGet,
  cacheInvalidate,
  cacheInvalidatePattern,
  getRedisHealth,
  closeRedis,
  get isAvailable() { return isRedisAvailable; },
  get client() { return redisClient; },
  get pub() { return redisPub; },
  get sub() { return redisSub; },
};