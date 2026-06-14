const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const { cacheGet, cacheInvalidate } = require('../config/redis');

const coinsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Terlalu banyak request. Tunggu sebentar.' }
});

// ==========================================
// COINS ENDPOINTS
// ==========================================

// Get coin balance
router.get('/coins/:student_id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'dosen' && req.user.id !== req.params.student_id) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  try {
    const result = await pool.query('SELECT COALESCE(coins, 0) as coins FROM users WHERE id = $1', [req.params.student_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    res.json({ coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 GET COINS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil saldo koin' });
  }
});

// Earn coins (from quiz, daily login, etc.)
router.post('/coins/earn', authenticateToken, coinsLimiter, async (req, res) => {
  const student_id = req.user.id; // ✅ SECURITY: Always use authenticated user, never from request body
  const { amount, reason } = req.body;
  
  // Input validation
  if (!amount || !reason) {
    return res.status(400).json({ error: 'amount dan reason wajib diisi.' });
  }
  
  const parsedAmount = parseInt(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0 || parsedAmount > 500) {
    return res.status(400).json({ error: 'Jumlah koin tidak valid (harus 1-500).' });
  }
  
  if (typeof reason !== 'string' || reason.trim().length === 0 || reason.length > 100) {
    return res.status(400).json({ error: 'Alasan tidak valid (1-100 karakter).' });
  }
  
  try {
    // FR-GAME-012: Anti-farming — check recent transactions for same reason
    const COOLDOWN_SECONDS = {
      'quiz_correct': 2,      // min 2s between quiz coin awards (prevent rapid repeat)
      'daily_login': 86400,   // daily login = once per day
      'default': 1
    };
    const reasonKey = Object.keys(COOLDOWN_SECONDS).find(k => reason.toLowerCase().includes(k)) || 'default';
    const cooldown = COOLDOWN_SECONDS[reasonKey];

    const recentCheck = await pool.query(
      `SELECT created_at FROM coin_transactions
       WHERE student_id = $1 AND reason = $2
       AND created_at > NOW() - INTERVAL '${cooldown} seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [student_id, reason.trim()]
    );

    if (recentCheck.rows.length > 0 && cooldown > 10) {
      return res.status(429).json({
        error: 'Terlalu cepat! Tunggu sebelum mendapat koin dari alasan yang sama.',
        cooldown_seconds: cooldown,
        next_available: new Date(new Date(recentCheck.rows[0].created_at).getTime() + cooldown * 1000).toISOString()
      });
    }

    // FR-GAME-012: Daily coin cap per category (prevent grinding)
    const DAILY_CAPS = { quiz: 500, daily_login: 100, achievement: 1000, live_quiz: 1000 };
    const categoryKey = Object.keys(DAILY_CAPS).find(k => reason.toLowerCase().includes(k));
    if (categoryKey) {
      const dailyCap = DAILY_CAPS[categoryKey];
      const dailyEarned = await pool.query(
        `SELECT COALESCE(SUM(amount), 0)::int as total FROM coin_transactions
         WHERE student_id = $1 AND reason ILIKE $2 AND created_at > NOW() - INTERVAL '24 hours'`,
        [student_id, `%${categoryKey}%`]
      );
      const currentDailyTotal = dailyEarned.rows[0]?.total || 0;
      if (currentDailyTotal + parsedAmount > dailyCap) {
        return res.status(429).json({
          error: `Batas koin harian untuk kategori "${categoryKey}" sudah tercapai (${dailyCap} koin/hari).`,
          daily_earned: currentDailyTotal,
          daily_cap: dailyCap
        });
      }
    }

    console.log(`💰 [Coins] User ${student_id} earning ${parsedAmount} coins. Reason: ${reason}`);
    await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2', [parsedAmount, student_id]);
    await pool.query('INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)', [student_id, parsedAmount, reason]);
    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [student_id]);
    console.log(`✅ [Coins] Success! New balance for ${student_id}: ${result.rows[0].coins}`);
    res.json({ message: `+${parsedAmount} koin diterima!`, coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 EARN COINS ERROR:', err);
    res.status(500).json({ error: 'Gagal menambahkan koin' });
  }
});

// Spend coins (buy component)
router.post('/coins/spend', authenticateToken, coinsLimiter, async (req, res) => {
  const student_id = req.user.id; // ✅ SECURITY: Always use authenticated user
  const { amount, reason } = req.body;
  
  // Input validation
  if (!amount || !reason) {
    return res.status(400).json({ error: 'amount dan reason wajib diisi.' });
  }
  
  const parsedAmount = parseInt(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0 || parsedAmount > 500) {
    return res.status(400).json({ error: 'Jumlah koin tidak valid (harus 1-500).' });
  }
  
  if (typeof reason !== 'string' || reason.trim().length === 0 || reason.length > 100) {
    return res.status(400).json({ error: 'Alasan tidak valid (1-100 karakter).' });
  }
  
  try {
    console.log(`💸 [Coins] User ${student_id} spending ${parsedAmount} coins. Reason: ${reason}`);
    const user = await pool.query('SELECT COALESCE(coins, 0) as coins FROM users WHERE id = $1', [student_id]);
    if (user.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });
    if (user.rows[0].coins < parsedAmount) {
      console.warn(`⚠️ [Coins] Insufficient funds for ${student_id}: ${user.rows[0].coins} < ${parsedAmount}`);
      return res.status(400).json({ error: 'Koin tidak cukup!', coins: user.rows[0].coins });
    }

    await pool.query('UPDATE users SET coins = COALESCE(coins, 0) - $1 WHERE id = $2', [parsedAmount, student_id]);
    await pool.query('INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)', [student_id, -parsedAmount, reason]);
    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [student_id]);
    console.log(`✅ [Coins] Success! New balance for ${student_id}: ${result.rows[0].coins}`);
    res.json({ message: `Berhasil membelanjakan ${parsedAmount} koin`, coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 SPEND COINS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengurangi koin' });
  }
});

// ==========================================
// DAILY LOGIN BONUS
// ==========================================
router.post('/daily-login', authenticateToken, async (req, res) => {
  const student_id = req.user.id; // SECURITY: Always use authenticated user ID
  if (!student_id) return res.status(400).json({ error: 'student_id wajib diisi.' });
  try {
    // Check if already claimed today
    const today = await pool.query('SELECT * FROM daily_logins WHERE student_id = $1 AND login_date = CURRENT_DATE', [student_id]);
    if (today.rows.length > 0) return res.status(200).json({ message: 'Sudah klaim hari ini', already_claimed: true, streak: today.rows[0].streak, coins_earned: today.rows[0].coins_earned });

    // Calculate streak
    const yesterday = await pool.query('SELECT streak FROM daily_logins WHERE student_id = $1 AND login_date = CURRENT_DATE - INTERVAL \'1 day\'', [student_id]);
    const newStreak = yesterday.rows.length > 0 ? yesterday.rows[0].streak + 1 : 1;

    // Coin rewards by streak day (cycle every 7)
    const streakDay = ((newStreak - 1) % 7) + 1;
    const rewardMap = { 1: 50, 2: 50, 3: 75, 4: 75, 5: 100, 6: 100, 7: 200 };
    const coinsEarned = rewardMap[streakDay] || 50;

    await pool.query('INSERT INTO daily_logins (student_id, streak, coins_earned) VALUES ($1, $2, $3)', [student_id, newStreak, coinsEarned]);
    await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2', [coinsEarned, student_id]);
    await pool.query('INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)', [student_id, coinsEarned, `Daily login streak day ${streakDay}`]);

    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [student_id]);
    console.log(`🎁 [Daily Login] ${student_id} earned ${coinsEarned} coins. New balance: ${result.rows[0].coins}`);
    res.json({ message: `+${coinsEarned} koin dari login harian!`, already_claimed: false, streak: newStreak, streak_day: streakDay, coins_earned: coinsEarned, total_coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 DAILY LOGIN ERROR:', err);
    res.status(500).json({ error: 'Gagal klaim login harian' });
  }
});

// ==========================================
// PC QUEST ENDPOINTS
// ==========================================

// Get PC Quest inventory
router.get('/pc-quest/inventory/:student_id', authenticateToken, async (req, res) => {
  // SECURITY: Only allow student to see their own inventory, or allow dosen
  if (req.user.role !== 'dosen' && req.user.id !== req.params.student_id) {
    return res.status(403).json({ error: 'Akses ditolak.' });
  }
  try {
    const result = await pool.query('SELECT component_id, purchased_at FROM pc_components WHERE student_id = $1 ORDER BY purchased_at ASC', [req.params.student_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 PC INVENTORY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil inventori' });
  }
});

// Backend Trusted Component Prices
const COMPONENT_PRICES = {
  'mobo_amd_a520': 400, 'mobo_amd_x370': 700, 'mobo_amd_b550': 900, 'mobo_intel_z590': 2000,
  'cpu_intel_i5_10400': 1000, 'cpu_intel_i7_11700k': 2500, 'cpu_amd_r5_5600x': 1500, 'cpu_amd_r7_5800x': 2800,
  'ram_ddr4_8gb': 400, 'ram_ddr4_16gb': 800, 'ram_ddr5_16gb': 1200, 'ram_ddr5_32gb': 2200,
  'gpu_gtx_1660s': 1500, 'gpu_rtx_3060': 3000, 'gpu_rtx_4070': 5000, 'gpu_rx_6700xt': 2800,
  'storage_hdd_1tb': 400, 'storage_ssd_500gb': 700, 'storage_nvme_1tb': 1500,
  'psu_500w_bronze': 500, 'psu_750w_gold': 1200, 'psu_1000w_platinum': 2500,
  'cool_stock': 200, 'cool_tower_air': 800, 'cool_aio_240': 1800,
  'case_budget': 400, 'case_mid_nzxt': 900, 'case_full_tower': 1800
};

// Buy component
router.post('/pc-quest/buy', authenticateToken, async (req, res) => {
  const { component_id } = req.body;
  const student_id = req.user.id; // SECURITY: Always use authenticated user ID
  if (!student_id || !component_id) return res.status(400).json({ error: 'Data pembelian tidak lengkap.' });
  
  const price = COMPONENT_PRICES[component_id];
  if (!price) return res.status(400).json({ error: 'Komponen tidak ditemukan di katalog.' });

  try {
    console.log(`🛒 [Shop] Buy attempt: ${student_id} -> ${component_id} (${price} coins)`);
    // Check if already owned
    const owned = await pool.query('SELECT * FROM pc_components WHERE student_id = $1 AND component_id = $2', [student_id, component_id]);
    if (owned.rows.length > 0) return res.status(400).json({ error: 'Komponen sudah dimiliki!' });

    // Check coins
    const user = await pool.query('SELECT COALESCE(coins, 0) as coins FROM users WHERE id = $1', [student_id]);
    if (user.rows[0].coins < price) {
      console.warn(`⚠️ [Shop] Insufficient funds: ${user.rows[0].coins} < ${price}`);
      return res.status(400).json({ error: 'Koin tidak cukup!', coins: user.rows[0].coins });
    }

    // Deduct coins and add component
    await pool.query('UPDATE users SET coins = COALESCE(coins, 0) - $1 WHERE id = $2', [price, student_id]);
    await pool.query('INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)', [student_id, -price, `Beli komponen: ${component_id}`]);
    await pool.query('INSERT INTO pc_components (student_id, component_id) VALUES ($1, $2)', [student_id, component_id]);

    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [student_id]);
    console.log(`✅ [Shop] Purchase success! New balance: ${result.rows[0].coins}`);
    res.json({ message: `Berhasil membeli ${component_id}!`, coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 BUY COMPONENT ERROR:', err);
    res.status(500).json({ error: 'Gagal membeli komponen' });
  }
});

// Sell component (70% refund)
router.post('/pc-quest/sell', authenticateToken, async (req, res) => {
  const { component_id } = req.body;
  const student_id = req.user.id; // SECURITY: Always use authenticated user ID
  if (!student_id || !component_id) return res.status(400).json({ error: 'Data penjualan tidak lengkap.' });
  
  const original_price = COMPONENT_PRICES[component_id];
  if (!original_price) return res.status(400).json({ error: 'Komponen tidak ditemukan di katalog.' });

  try {
    console.log(`🏷️ [Shop] Sell attempt: ${student_id} -> ${component_id}`);
    const owned = await pool.query('DELETE FROM pc_components WHERE student_id = $1 AND component_id = $2 RETURNING *', [student_id, component_id]);
    if (owned.rows.length === 0) return res.status(400).json({ error: 'Komponen tidak dimiliki!' });

    const refund = Math.floor(original_price * 0.7);
    await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2', [refund, student_id]);
    await pool.query('INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, $2, $3)', [student_id, refund, `Jual komponen: ${component_id} (70%)`]);

    const result = await pool.query('SELECT coins FROM users WHERE id = $1', [student_id]);
    console.log(`✅ [Shop] Sell success! Refunded ${refund} coins. New balance: ${result.rows[0].coins}`);
    res.json({ message: `Komponen dijual! +${refund} koin refund`, coins: result.rows[0].coins });
  } catch (err) {
    console.error('🔥 SELL COMPONENT ERROR:', err);
    res.status(500).json({ error: 'Gagal menjual komponen' });
  }
});

// ==========================================
// PC SHOWROOM ENDPOINTS
// ==========================================

// Publish build to showroom
router.post('/showroom/publish', authenticateToken, async (req, res) => {
  const { build_name, components, benchmark_scores, is_compatible } = req.body;
  const student_id = req.user.id; // SECURITY: Always use authenticated user ID
  if (!student_id || !build_name || !components || !benchmark_scores) {
    return res.status(400).json({ error: 'Data build tidak lengkap.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO pc_builds (student_id, build_name, components, benchmark_scores, is_compatible)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [student_id, build_name, JSON.stringify(components), JSON.stringify(benchmark_scores), is_compatible !== false]
    );
    console.log(`🏗️ [Showroom] Build published: ${build_name} by ${student_id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 SHOWROOM PUBLISH ERROR:', err);
    res.status(500).json({ error: 'Gagal mempublikasikan build' });
  }
});

// Get all builds (with reactions count & user's own reactions)
router.get('/showroom/builds', authenticateToken, async (req, res) => {
  const { sort = 'newest', page = 1, limit = 20 } = req.query;
  const student_id = req.user?.id || '00000000-0000-0000-0000-000000000000';
  
  // ✅ SECURITY: Whitelist valid sort options (prevent SQL injection)
  const ALLOWED_SORTS = {
    'newest': 'b.created_at DESC',
    'most_liked': 'like_count DESC NULLS LAST, b.created_at DESC',
    'most_fire': 'fire_count DESC NULLS LAST, b.created_at DESC',
    'best_gaming': "NULLIF(b.benchmark_scores->>'gaming', '')::int DESC NULLS LAST"
  };
  
  const orderBy = ALLOWED_SORTS[sort] || ALLOWED_SORTS['newest'];

  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const query = `
      SELECT b.*,
        u.full_name as builder_name,
        u.avatar_id,
        COALESCE(lr.like_count, 0)::int as like_count,
        COALESCE(fr.fire_count, 0)::int as fire_count,
        COALESCE(cc.comment_count, 0)::int as comment_count,
        CASE WHEN ml.id IS NOT NULL THEN true ELSE false END as my_like,
        CASE WHEN mf.id IS NOT NULL THEN true ELSE false END as my_fire
      FROM pc_builds b
      JOIN users u ON b.student_id = u.id
      LEFT JOIN (SELECT build_id, COUNT(*) as like_count FROM build_reactions WHERE reaction_type='like' GROUP BY build_id) lr ON lr.build_id = b.id
      LEFT JOIN (SELECT build_id, COUNT(*) as fire_count FROM build_reactions WHERE reaction_type='fire' GROUP BY build_id) fr ON fr.build_id = b.id
      LEFT JOIN (SELECT build_id, COUNT(*) as comment_count FROM build_comments GROUP BY build_id) cc ON cc.build_id = b.id
      LEFT JOIN build_reactions ml ON ml.build_id = b.id AND ml.student_id = $1 AND ml.reaction_type = 'like'
      LEFT JOIN build_reactions mf ON mf.build_id = b.id AND mf.student_id = $1 AND mf.reaction_type = 'fire'
      ORDER BY ${orderBy}
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [student_id, parseInt(limit), offset]);

    // Attach comments to each build (Optimized without N+1 query)
    if (result.rows.length > 0) {
      const buildIds = result.rows.map(b => b.id);
      const commentsResult = await pool.query(
        `SELECT bc.*, u.full_name as commenter_name, u.avatar_id 
         FROM build_comments bc 
         JOIN users u ON bc.student_id = u.id 
         WHERE bc.build_id = ANY($1::uuid[]) 
         ORDER BY bc.created_at ASC`,
        [buildIds]
      );
      
      const commentsMap = {};
      for (const comment of commentsResult.rows) {
        if (!commentsMap[comment.build_id]) {
          commentsMap[comment.build_id] = [];
        }
        if (commentsMap[comment.build_id].length < 50) {
           commentsMap[comment.build_id].push(comment);
        }
      }
      
      for (const build of result.rows) {
        build.comments = commentsMap[build.id] || [];
      }
    }

    res.json(result.rows);
  } catch (err) {
    console.error('🔥 SHOWROOM GET BUILDS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data showroom' });
  }
});

// Toggle reaction (like/fire)
router.post('/showroom/react', authenticateToken, async (req, res) => {
  const { build_id, student_id, reaction_type } = req.body;
  if (!build_id || !student_id || !['like', 'fire'].includes(reaction_type)) {
    return res.status(400).json({ error: 'Data reaksi tidak valid.' });
  }
  try {
    // Check if exists -> toggle
    const existing = await pool.query(
      'SELECT id FROM build_reactions WHERE build_id = $1 AND student_id = $2 AND reaction_type = $3',
      [build_id, student_id, reaction_type]
    );
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM build_reactions WHERE id = $1', [existing.rows[0].id]);
      res.json({ message: 'Reaction removed', toggled: false });
    } else {
      await pool.query(
        'INSERT INTO build_reactions (build_id, student_id, reaction_type) VALUES ($1, $2, $3)',
        [build_id, student_id, reaction_type]
      );
      res.json({ message: 'Reaction added', toggled: true });
    }
  } catch (err) {
    console.error('🔥 SHOWROOM REACT ERROR:', err);
    res.status(500).json({ error: 'Gagal menambahkan reaksi' });
  }
});

// Add comment
router.post('/showroom/comment', authenticateToken, async (req, res) => {
  const { build_id, student_id, comment_text } = req.body;
  if (!build_id || !student_id || !comment_text?.trim()) {
    return res.status(400).json({ error: 'Data komentar tidak lengkap.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO build_comments (build_id, student_id, comment_text) VALUES ($1, $2, $3) RETURNING *',
      [build_id, student_id, comment_text.trim()]
    );
    const user = await pool.query('SELECT full_name FROM users WHERE id = $1', [student_id]);
    const comment = { ...result.rows[0], commenter_name: user.rows[0]?.full_name || 'User' };
    res.status(201).json({ message: 'Komentar ditambahkan', comment });
  } catch (err) {
    console.error('🔥 SHOWROOM COMMENT ERROR:', err);
    res.status(500).json({ error: 'Gagal menambahkan komentar' });
  }
});

// Delete own comment
router.delete('/showroom/comment/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM build_comments WHERE id = $1 AND student_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Komentar tidak ditemukan atau bukan milik Anda.' });
    res.json({ message: 'Komentar dihapus' });
  } catch (err) {
    console.error('🔥 SHOWROOM DELETE COMMENT ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus komentar' });
  }
});

// Grade a build (Dosen only)
router.put('/showroom/builds/:id/grade', authenticateToken, async (req, res) => {
  if (req.user.role !== 'dosen') {
    return res.status(403).json({ error: 'Hanya dosen yang bisa memberi nilai' });
  }
  const { dosen_score, dosen_feedback } = req.body;
  if (dosen_score === undefined || dosen_score < 0 || dosen_score > 100) {
    return res.status(400).json({ error: 'Nilai harus antara 0-100' });
  }
  try {
    // Ensure columns exist (idempotent migration)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE pc_builds ADD COLUMN IF NOT EXISTS dosen_score INT;
        ALTER TABLE pc_builds ADD COLUMN IF NOT EXISTS dosen_feedback TEXT;
        ALTER TABLE pc_builds ADD COLUMN IF NOT EXISTS graded_by UUID;
        ALTER TABLE pc_builds ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
      EXCEPTION WHEN OTHERS THEN NULL;
      END $$;
    `);

    const result = await pool.query(
      'UPDATE pc_builds SET dosen_score = $1, dosen_feedback = $2, graded_by = $3, graded_at = NOW() WHERE id = $4 RETURNING *',
      [dosen_score, dosen_feedback || null, req.user.id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Build tidak ditemukan' });
    console.log(`🏆 [Showroom] Build ${req.params.id} graded ${dosen_score}/100 by dosen ${req.user.id}`);
    res.json({ message: 'Nilai berhasil disimpan', build: result.rows[0] });
  } catch (err) {
    console.error('🔥 SHOWROOM GRADE ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan nilai' });
  }
});

// ==========================================
// COMPONENT DETECTIVE API
// ==========================================
router.post('/detective/submit', authenticateToken, async (req, res) => {
  const { total_score, total_time } = req.body;
  if (total_score === undefined || total_time === undefined) return res.status(400).json({ error: 'Data skor tidak lengkap.' });

  try {
    // Cari hari senin minggu ini
    const weekStart = new Date();
    const day = weekStart.getUTCDay();
    const diff = weekStart.getUTCDate() - day + (day === 0 ? -6 : 1);
    weekStart.setUTCDate(diff);
    weekStart.setUTCHours(0, 0, 0, 0);

    const result = await pool.query(
      'INSERT INTO detective_scores (student_id, total_score, completion_time_ms, week_start) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, total_score, total_time, weekStart.toISOString().split('T')[0]]
    );
    res.status(201).json({ message: 'Skor disimpan', data: result.rows[0] });
  } catch (err) {
    console.error('🔥 DETECTIVE SUBMIT ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan skor Detective' });
  }
});

router.get('/detective/leaderboard', authenticateToken, async (req, res) => {
  try {
    // ✅ PAGINATION
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const weekStart = new Date();
    const day = weekStart.getUTCDay();
    const diff = weekStart.getUTCDate() - day + (day === 0 ? -6 : 1);
    weekStart.setUTCDate(diff);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) as total
      FROM detective_scores d
      WHERE d.week_start = $1 AND EXISTS (SELECT 1 FROM users u WHERE u.id = d.student_id AND u.role = 'mahasiswa')
    `, [weekStartStr]);
    const totalItems = parseInt(countResult.rows[0].total) || 0;
    const totalPages = Math.ceil(totalItems / limit);

    const result = await pool.query(`
      SELECT d.*, u.full_name
      FROM detective_scores d
      JOIN users u ON d.student_id = u.id
      WHERE d.week_start = $1 AND u.role = 'mahasiswa'
      ORDER BY d.total_score DESC, d.completion_time_ms ASC
      LIMIT $2 OFFSET $3
    `, [weekStartStr, limit, offset]);
    
    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('🔥 DETECTIVE LEADERBOARD ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil leaderboard Detective' });
  }
});

// ==========================================
// MAIN LEADERBOARD & SEASON API
// ==========================================
function getCurrentSeason() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-11

  // S1: May-Jul (4-6), S2: Aug-Oct (7-9), S3: Nov-Jan (10-0), S4: Feb-Apr (1-3)
  let seasonName, start, end;
  if (month >= 4 && month <= 6) {
    seasonName = `Season 1 (${year})`;
    start = new Date(Date.UTC(year, 4, 1)); end = new Date(Date.UTC(year, 7, 0, 23, 59, 59));
  } else if (month >= 7 && month <= 9) {
    seasonName = `Season 2 (${year})`;
    start = new Date(Date.UTC(year, 7, 1)); end = new Date(Date.UTC(year, 10, 0, 23, 59, 59));
  } else if (month >= 10 || month === 0) {
    const sYear = month === 0 ? year - 1 : year;
    seasonName = `Season 3 (${sYear}-${sYear + 1})`;
    start = new Date(Date.UTC(sYear, 10, 1)); end = new Date(Date.UTC(sYear + 1, 1, 0, 23, 59, 59));
  } else {
    seasonName = `Season 4 (${year})`;
    start = new Date(Date.UTC(year, 1, 1)); end = new Date(Date.UTC(year, 4, 0, 23, 59, 59));
  }
  return { seasonName, start, end };
}

router.get('/leaderboard/main', authenticateToken, async (req, res) => {
  const { category, room_id } = req.query; // 'coins', 'xp', 'quizzes', 'coder'
  const { seasonName, start, end } = getCurrentSeason();

  try {
    // TASK-PERF-001: Redis caching for expensive leaderboard aggregation (30s TTL)
    const cacheKey = `leaderboard:${category || 'coins'}:${room_id || 'global'}`;
    
    const data = await cacheGet(cacheKey, async () => {
      let result = { rows: [] };
      
      let joinRoom = '';
      let whereRoom = "WHERE u.role = 'mahasiswa'";
      let params = [start.toISOString(), end.toISOString()];
      
      if (room_id && room_id !== 'global') {
        joinRoom = 'JOIN class_members rm ON u.id = rm.student_id';
        whereRoom += ' AND rm.room_id = $3';
        params.push(room_id);
      }

      if (category === 'coins') {
        result = await pool.query(`
          SELECT u.id, u.full_name, u.avatar_id, COALESCE(SUM(c.amount), 0)::int as score
          FROM users u
          ${joinRoom}
          LEFT JOIN coin_transactions c ON u.id = c.student_id AND c.amount > 0 AND c.created_at >= $1 AND c.created_at <= $2
          ${whereRoom}
          GROUP BY u.id ORDER BY score DESC LIMIT 10
        `, params);
      } else if (category === 'quizzes') {
        result = await pool.query(`
          SELECT u.id, u.full_name, u.avatar_id, COUNT(c.id)::int as score
          FROM users u
          ${joinRoom}
          LEFT JOIN coin_transactions c ON u.id = c.student_id AND c.reason LIKE 'Level %' AND c.created_at >= $1 AND c.created_at <= $2
          ${whereRoom}
          GROUP BY u.id ORDER BY score DESC LIMIT 10
        `, params);
      } else if (category === 'coder') {
        result = await pool.query(`
          SELECT u.id, u.full_name, u.avatar_id, COUNT(c.id)::int as score
          FROM users u
          ${joinRoom}
          LEFT JOIN coin_transactions c ON u.id = c.student_id AND c.reason LIKE 'BOSS RAID Victory%' AND c.created_at >= $1 AND c.created_at <= $2
          ${whereRoom}
          GROUP BY u.id ORDER BY score DESC LIMIT 10
        `, params);
      } else if (category === 'xp') {
        result = await pool.query(`
          SELECT u.id, u.full_name, u.avatar_id, 
            COALESCE(SUM(
              CASE a.badge_id 
                WHEN 'first_step' THEN 50
                WHEN 'bookworm' THEN 100
                WHEN 'quiz_warrior' THEN 150
                WHEN 'mind_mapper' THEN 100
                WHEN 'card_master' THEN 100
                WHEN 'ar_explorer' THEN 200
                WHEN 'perfect_score' THEN 300
                WHEN 'pipeline_master' THEN 250
                ELSE 0 
              END
            ), 0)::int as score
          FROM users u
          ${joinRoom}
          LEFT JOIN achievements a ON u.id = a.student_id AND a.unlocked_at >= $1 AND a.unlocked_at <= $2
          ${whereRoom}
          GROUP BY u.id ORDER BY score DESC LIMIT 10
        `, params);
      }

      // Check for Archi Master title
      const winners = await pool.query('SELECT student_id, season_name FROM season_winners');
      const winnerMap = {};
      winners.rows.forEach(w => winnerMap[w.student_id] = w.season_name);

      return result.rows.map((r, idx) => ({
        ...r,
        rank: idx + 1,
        is_master: !!winnerMap[r.id],
        master_season: winnerMap[r.id] || null
      }));
    }, 30); // 30 second cache TTL

    res.json({ season: { name: seasonName, start, end }, leaderboard: data });
  } catch (err) {
    console.error('🔥 MAIN LEADERBOARD ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil leaderboard utama' });
  }
});

module.exports = router;
