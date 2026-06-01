const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { updateTheta, thetaToCategory, diffLevelToTheta } = require('../services/irt.service');

const QUIZ_BANK_THRESHOLD = 20; // minimum soal per topik untuk IRT valid

// ─── Update theta setelah mahasiswa menyelesaikan quiz ─────────────
router.post('/update-theta', authenticateToken, async (req, res) => {
  const student_id = req.user.id;
  const { room_id, responses } = req.body;
  if (!student_id || !responses || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'student_id dan responses (array) wajib diisi.' });
  }
  if (responses.length > 50) {
    return res.status(400).json({ error: 'Terlalu banyak respon dalam satu sesi (maks 50).' });
  }
  for (const resItem of responses) {
    if (typeof resItem.correct !== 'boolean' || ![1, 2, 3].includes(Number(resItem.difficulty))) {
      return res.status(400).json({ error: 'Format respon IRT tidak valid. Perlu "correct" (boolean) dan "difficulty" (1-3).' });
    }
  }

  try {
    const existing = await pool.query(
      'SELECT theta, responses_count FROM student_ability WHERE student_id = $1 AND room_id = $2',
      [student_id, room_id || null]
    );

    const currentTheta = existing.rows.length > 0 ? existing.rows[0].theta : 0.0;
    const currentCount = existing.rows.length > 0 ? existing.rows[0].responses_count : 0;

    const irtResponses = responses.map(r => ({
      correct: r.correct,
      difficulty: diffLevelToTheta(r.difficulty)
    }));

    const newTheta = updateTheta(irtResponses, currentTheta);
    const category = thetaToCategory(newTheta);
    const newCount = currentCount + responses.length;

    await pool.query(`
      INSERT INTO student_ability (student_id, room_id, theta, responses_count, last_updated)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (student_id, room_id) DO UPDATE
      SET theta = EXCLUDED.theta, responses_count = EXCLUDED.responses_count, last_updated = NOW()
    `, [student_id, room_id || null, newTheta, newCount]);

    await pool.query('UPDATE users SET theta = $1 WHERE id = $2', [newTheta, student_id]);

    res.json({
      theta: newTheta,
      category: category.category,
      label: category.label,
      color: category.color,
      responses_count: newCount
    });
  } catch (err) {
    console.error('🔥 IRT UPDATE ERROR:', err);
    res.status(500).json({ error: 'Gagal memperbarui ability estimate' });
  }
});

// ─── ENDPOINT KHUSUS: Force Merge & Sync JSON ───────────────────────
router.post('/bank/:roomId/force-sync', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { execSync } = require('child_process');
    const path = require('path');
    const fs = require('fs');

    // 1. Eksekusi script penggabung (update_all_quizzes_final.js)
    const scriptPath = path.resolve(__dirname, '../../src/data/update_all_quizzes_final.js');
    console.log(`[Force Sync] Running sync script: ${scriptPath}`);
    execSync(`node "${scriptPath}"`, { encoding: 'utf-8' });

    // 2. Baca file quizzes.json yang sudah ter-update
    const jsonPath = path.resolve(__dirname, '../../src/data/quizzes.json');
    console.log(`[Force Sync] Reading updated JSON: ${jsonPath}`);
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const quizData = JSON.parse(rawData);

    // 3. Ekstrak pertanyaan
    let questions = [];
    if (Array.isArray(quizData)) {
      questions = quizData;
    } else if (quizData.levels) {
      questions = quizData.levels.flatMap(l => l.questions.map(q => ({
        question_text: q.question,
        options: q.options,
        correct_index: q.answer,
        difficulty: q.difficulty || 2,
        topic: l.chapterTitle || l.name || 'General',
        explanation: q.explanation || ''
      })));
    }

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Tidak ada soal ditemukan di quizzes.json' });
    }

    // 4. Optimasi Ekstrem: Ambil semua soal yang sudah ada di DB dalam 1 Query! (Mencegah N+1 Problem)
    const existingRes = await pool.query(
      'SELECT question_text FROM quiz_questions WHERE room_id = $1',
      [roomId]
    );
    const existingTexts = new Set(existingRes.rows.map(r => r.question_text));

    // 5. Masukkan ke database (Sinkronisasi Tambah) secara batch
    let inserted = 0;
    const validQuestionTexts = [];
    const insertPromises = [];
    
    for (const q of questions) {
      if (!q.question_text || !q.options || q.options.length < 2) continue;
      validQuestionTexts.push(q.question_text);
      
      if (!existingTexts.has(q.question_text)) {
        // Tambahkan ke antrian eksekusi paralel
        const p = pool.query(
          `INSERT INTO quiz_questions 
           (room_id, question_text, options, correct_index, difficulty, topic, explanation)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            roomId, 
            q.question_text, 
            JSON.stringify(q.options), 
            q.correct_index, 
            q.difficulty, 
            q.topic, 
            q.explanation
          ]
        );
        insertPromises.push(p);
        inserted++;
      }
    }

    // Eksekusi semua insert secara paralel
    if (insertPromises.length > 0) {
      await Promise.all(insertPromises);
    }

    // 6. Cleanup (Sinkronisasi Hapus): Hapus soal di DB yang TIDAK ADA di JSON
    let deleted = 0;
    if (validQuestionTexts.length > 0) {
      const deleteRes = await pool.query(
        `DELETE FROM quiz_questions 
         WHERE room_id = $1 AND question_text != ALL($2::text[]) 
         RETURNING id`,
        [roomId, validQuestionTexts]
      );
      deleted = deleteRes.rowCount;
    }

    console.log(`[Force Sync] Sukses insert ${inserted} soal baru, hapus ${deleted} soal lama/sampah.`);
    res.json({ success: true, inserted, deleted, message: 'Sinkronisasi 1-to-1 berhasil' });
  } catch (err) {
    console.error('🔥 FORCE SYNC ERROR:', err);
    res.status(500).json({ error: 'Gagal menjalankan script sinkronisasi', details: err.message });
  }
});

// ─── ENDPOINT KHUSUS: Cek Jumlah Soal ───────────────────────────────
router.get('/bank/:roomId/count-check', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const fs = require('fs');
    const path = require('path');
    
    // Hitung di JSON
    const jsonPath = path.resolve(__dirname, '../../src/data/quizzes.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const quizData = JSON.parse(rawData);
    
    let jsonCount = 0;
    if (quizData.levels) {
      quizData.levels.forEach(l => { jsonCount += l.questions.length; });
    }
    
    // Hitung di DB
    const dbRes = await pool.query('SELECT COUNT(*) FROM quiz_questions WHERE room_id = $1', [roomId]);
    const dbCount = parseInt(dbRes.rows[0].count, 10);
    
    res.json({ jsonCount, dbCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Get IRT profile mahasiswa ─────────────────────────────────────
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const abilities = await pool.query(
      `SELECT sa.*, r.course_name FROM student_ability sa
       LEFT JOIN rooms r ON sa.room_id = r.id
       WHERE sa.student_id = $1 ORDER BY sa.last_updated DESC`,
      [req.params.studentId]
    );
    const globalTheta = await pool.query('SELECT theta FROM users WHERE id = $1', [req.params.studentId]);
    const theta = globalTheta.rows[0]?.theta || 0.0;
    const category = thetaToCategory(theta);
    res.json({
      global_theta: theta,
      category,
      per_room: abilities.rows.map(a => ({
        room_id: a.room_id,
        course_name: a.course_name,
        theta: a.theta,
        category: thetaToCategory(a.theta),
        responses_count: a.responses_count,
        last_updated: a.last_updated
      }))
    });
  } catch (err) {
    console.error('🔥 IRT PROFILE ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil profil IRT' });
  }
});

// ─── IRT room summary ──────────────────────────────────────────────
router.get('/room/:roomId/summary', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.roomId;
    if (req.user.role === 'dosen') {
      const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [roomId, req.user.id]);
      if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda tidak memiliki akses ke room ini' });
    }

    const result = await pool.query(`
      SELECT u.id as student_id, u.full_name,
        u.theta as global_theta,
        COALESCE(sa.responses_count, 0) as responses_count
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      LEFT JOIN student_ability sa ON u.id = sa.student_id AND sa.room_id = $1
      WHERE cm.room_id = $1
      ORDER BY u.full_name ASC
    `, [roomId]);

    res.json(result.rows.map(row => {
      const theta = row.global_theta || 0.0;
      const category = thetaToCategory(theta);
      return {
        student_id: row.student_id,
        full_name: row.full_name,
        theta,
        category_label: category.label,
        category_color: category.color,
        responses_count: row.responses_count
      };
    }));
  } catch (err) {
    console.error('🔥 IRT ROOM SUMMARY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil ringkasan IRT kelas' });
  }
});

// ─── FR-IRT-006: Quiz bank health check ───────────────────────────
// Returns per-topic count and warning if below threshold
router.get('/bank/health', authenticateToken, async (req, res) => {
  try {
    // Count questions per difficulty level from quiz_questions table (room-specific bank)
    // Also falls back to counting from the static data if no DB questions exist
    let perDifficulty = [];
    try {
      const dbResult = await pool.query(`
        SELECT difficulty, COUNT(*)::int as count
        FROM quiz_questions
        GROUP BY difficulty
        ORDER BY difficulty
      `);
      perDifficulty = dbResult.rows;
    } catch {
      // quiz_questions table may not exist yet — return warning
      perDifficulty = [];
    }

    const totalQuestions = perDifficulty.reduce((sum, r) => sum + r.count, 0);
    const hasEnough = perDifficulty.every(r => r.count >= QUIZ_BANK_THRESHOLD);
    const warnings = perDifficulty
      .filter(r => r.count < QUIZ_BANK_THRESHOLD)
      .map(r => ({
        difficulty: r.difficulty,
        current: r.count,
        needed: QUIZ_BANK_THRESHOLD - r.count,
        message: `Difficulty ${r.difficulty}: ${r.count} soal (butuh minimal ${QUIZ_BANK_THRESHOLD})`
      }));

    res.json({
      total_questions: totalQuestions,
      threshold_per_difficulty: QUIZ_BANK_THRESHOLD,
      is_sufficient: hasEnough && totalQuestions >= QUIZ_BANK_THRESHOLD * 3,
      per_difficulty: perDifficulty,
      warnings,
      recommendation: !hasEnough
        ? `⚠️ IRT belum optimal. Tambah setidaknya ${warnings.reduce((s, w) => s + w.needed, 0)} soal untuk estimasi reliable.`
        : '✅ Bank soal sudah cukup untuk IRT reliable.'
    });
  } catch (err) {
    console.error('🔥 BANK HEALTH ERROR:', err);
    res.status(500).json({ error: 'Gagal mengecek kesehatan bank soal' });
  }
});

// ─── FR-IRT-007: Quiz Bank CRUD for dosen ─────────────────────────

// GET: List questions for a room (with pagination)
router.get('/bank/:roomId', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, difficulty, topic } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let whereClause = 'WHERE room_id = $1';
    const params = [req.params.roomId];
    let paramIdx = 2;

    if (difficulty) { whereClause += ` AND difficulty = $${paramIdx++}`; params.push(parseInt(difficulty)); }
    if (topic)      { whereClause += ` AND topic ILIKE $${paramIdx++}`; params.push(`%${topic}%`); }

    const questions = await pool.query(
      `SELECT * FROM quiz_questions ${whereClause}
       ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), offset]
    );
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as total FROM quiz_questions ${whereClause}`,
      params
    );

    res.json({
      questions: questions.rows,
      total: countRes.rows[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countRes.rows[0].total / parseInt(limit))
    });
  } catch (err) {
    console.error('🔥 BANK LIST ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil daftar soal' });
  }
});

// POST: Create new question (dosen only)
router.post('/bank/:roomId', authenticateToken, requireRole('dosen'), async (req, res) => {
  const { question_text, options, correct_index, difficulty, topic, explanation } = req.body;
  
  if (!question_text || !Array.isArray(options) || options.length !== 4 || correct_index === undefined) {
    return res.status(400).json({ error: 'Wajib ada: question_text, options (4 pilihan), correct_index.' });
  }
  if (![1, 2, 3].includes(parseInt(difficulty))) {
    return res.status(400).json({ error: 'Difficulty harus 1 (mudah), 2 (sedang), atau 3 (sulit).' });
  }
  // Verify dosen owns room
  const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [req.params.roomId, req.user.id]);
  if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen room ini.' });

  try {
    const result = await pool.query(
      `INSERT INTO quiz_questions (room_id, created_by, question_text, options, correct_index, difficulty, topic, explanation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [req.params.roomId, req.user.id, question_text.trim(), JSON.stringify(options), parseInt(correct_index), parseInt(difficulty), topic || null, explanation || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 BANK CREATE ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat soal' });
  }
});

// PUT: Update question
router.put('/bank/:roomId/:questionId', authenticateToken, requireRole('dosen'), async (req, res) => {
  const { question_text, options, correct_index, difficulty, topic, explanation } = req.body;
  const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [req.params.roomId, req.user.id]);
  if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen room ini.' });

  try {
    const result = await pool.query(
      `UPDATE quiz_questions SET question_text = COALESCE($1, question_text),
        options = COALESCE($2, options), correct_index = COALESCE($3, correct_index),
        difficulty = COALESCE($4, difficulty), topic = COALESCE($5, topic),
        explanation = COALESCE($6, explanation), updated_at = NOW()
       WHERE id = $7 AND room_id = $8 RETURNING *`,
      [question_text, options ? JSON.stringify(options) : null, correct_index !== undefined ? parseInt(correct_index) : null,
       difficulty ? parseInt(difficulty) : null, topic, explanation, req.params.questionId, req.params.roomId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 BANK UPDATE ERROR:', err);
    res.status(500).json({ error: 'Gagal memperbarui soal' });
  }
});

// DELETE: Remove question
router.delete('/bank/:roomId/:questionId', authenticateToken, requireRole('dosen'), async (req, res) => {
  const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [req.params.roomId, req.user.id]);
  if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen room ini.' });

  try {
    const result = await pool.query(
      'DELETE FROM quiz_questions WHERE id = $1 AND room_id = $2 RETURNING id',
      [req.params.questionId, req.params.roomId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Soal tidak ditemukan.' });
    res.json({ message: 'Soal berhasil dihapus.' });
  } catch (err) {
    console.error('🔥 BANK DELETE ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus soal' });
  }
});

// POST: Bulk import via array (CSV-parsed on frontend)
router.post('/bank/:roomId/bulk-import', authenticateToken, requireRole('dosen'), async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'questions harus berupa array tidak kosong.' });
  }
  if (questions.length > 1000) {
    return res.status(400).json({ error: 'Maks 1000 soal per bulk import.' });
  }
  const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [req.params.roomId, req.user.id]);
  if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda bukan dosen room ini.' });

  try {
    await pool.query('BEGIN');
    let inserted = 0;
    const errors = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text || !Array.isArray(q.options) || q.options.length !== 4 || q.correct_index === undefined) {
        errors.push(`Baris ${i + 1}: format tidak valid (butuh question_text, options[4], correct_index)`);
        continue;
      }
      // Check if question already exists in this room
      const exists = await pool.query('SELECT id FROM quiz_questions WHERE room_id = $1 AND question_text = $2', [req.params.roomId, q.question_text.trim()]);
      
      if (exists.rows.length === 0) {
        await pool.query(
          `INSERT INTO quiz_questions (room_id, created_by, question_text, options, correct_index, difficulty, topic, explanation, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [req.params.roomId, req.user.id, q.question_text.trim(), JSON.stringify(q.options),
           parseInt(q.correct_index), parseInt(q.difficulty) || 2, q.topic || null, q.explanation || null]
        );
        inserted++;
      }
    }
    await pool.query('COMMIT');
    res.status(201).json({ inserted, errors, message: `${inserted} soal berhasil diimport.` });
  } catch (err) {
    await pool.query('ROLLBACK').catch(() => {});
    console.error('🔥 BULK IMPORT ERROR:', err);
    res.status(500).json({ error: 'Gagal bulk import soal' });
  }
});

module.exports = router;

// ─── FR-IRT: Theta history per mahasiswa (untuk History Chart) ─────
// GET /api/irt/student/:studentId/history?weeks=8
router.get('/student/:studentId/history', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const weeks = Math.min(parseInt(req.query.weeks) || 8, 52);

    // Hanya pemilik data atau dosen yang boleh akses
    if (req.user.role !== 'dosen' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    // Query weekly theta snapshot: ambil theta terakhir per minggu
    const result = await pool.query(`
      SELECT
        DATE_TRUNC('week', last_updated) AS week_start,
        AVG(theta)::float                AS theta_avg,
        MAX(last_updated)                AS last_update_in_week
      FROM student_ability
      WHERE student_id = $1
        AND last_updated >= NOW() - ($2 || ' weeks')::interval
      GROUP BY DATE_TRUNC('week', last_updated)
      ORDER BY week_start ASC
    `, [studentId, weeks]);

    // Jika tidak ada data riwayat di student_ability, ambil global theta sebagai titik tunggal
    if (result.rows.length === 0) {
      const userRes = await pool.query('SELECT theta FROM users WHERE id = $1', [studentId]);
      const currentTheta = userRes.rows[0]?.theta || 0.0;
      return res.json({
        weeks_requested: weeks,
        data_points: currentTheta !== 0.0 ? [{
          week: new Date().toISOString().slice(0, 10),
          theta: currentTheta,
          label: 'Saat ini'
        }] : [],
        message: currentTheta === 0.0
          ? 'Belum ada riwayat. Mulai kerjakan quiz untuk melihat perkembangan.'
          : 'Data riwayat akan tersedia setelah beberapa sesi quiz.'
      });
    }

    // Format untuk frontend chart
    const dataPoints = result.rows.map((row, idx) => ({
      week: row.week_start.toISOString().slice(0, 10),
      theta: parseFloat(row.theta_avg.toFixed(3)),
      label: `Minggu ${idx + 1}`
    }));

    res.json({
      weeks_requested: weeks,
      data_points: dataPoints,
      message: null
    });
  } catch (err) {
    console.error('🔥 THETA HISTORY ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil riwayat theta' });
  }
});
