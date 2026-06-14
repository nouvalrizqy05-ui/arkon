const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { thetaToCategory } = require('../services/irt.service');
const { calculateClassNGain, getLearningEffectiveness } = require('../services/ngain.service');
const PDFDocument = require('pdfkit');

router.get('/student-insight/:studentId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'dosen' && req.user.id !== req.params.studentId) {
    return res.status(403).json({ error: 'Akses ditolak. Anda hanya dapat melihat data Anda sendiri.' });
  }
  try {
    const topicScores = await pool.query(`
      SELECT m.file_name as topic_raw, AVG(a.score)::int as avg_score, COUNT(a.id)::int as attempts
      FROM analytics a
      JOIN materials m ON a.material_id = m.id
      WHERE a.student_id = $1
      GROUP BY m.file_name ORDER BY avg_score ASC
    `, [req.params.studentId]);

    const overall = await pool.query(`
      SELECT AVG(score)::int as avg_score, COUNT(id)::int as total_quizzes,
        MAX(score) as best_score, MIN(score) as worst_score
      FROM analytics WHERE student_id = $1
    `, [req.params.studentId]);

    const activity = await pool.query(`
      SELECT DATE(created_at) as day, COUNT(*)::int as count
      FROM coin_transactions WHERE student_id = $1 AND created_at > NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at) ORDER BY day
    `, [req.params.studentId]);

    const streak = await pool.query(
      'SELECT * FROM flashcard_streaks WHERE student_id = $1', [req.params.studentId]
    );

    const badges = await pool.query(
      'SELECT COUNT(*)::int as count FROM achievements WHERE student_id = $1', [req.params.studentId]
    );

    const coins = await pool.query(
      'SELECT COALESCE(coins, 0) as coins FROM users WHERE id = $1', [req.params.studentId]
    );

    const radarData = topicScores.rows.map(row => {
      let topicName = row.topic_raw;
      try { topicName = JSON.parse(row.topic_raw).title; } catch(e) {}
      return { topic: topicName, score: row.avg_score, attempts: row.attempts };
    });

    const weaknesses = radarData.filter(r => r.score < 60);

    const stats = overall.rows[0] || { avg_score: 0, total_quizzes: 0, best_score: 0, worst_score: 0 };
    let uasPrediction = 0;
    let uasCategory = 'Tidak Cukup Data';
    
    if (stats.total_quizzes >= 3) {
      let base = stats.avg_score * 0.6;
      const trendBonus = (stats.best_score - stats.avg_score > 15) ? 8 : 0;
      const consistencyBonus = Math.min(stats.total_quizzes * 1.5, 10);
      const weaknessPenalty = weaknesses.length * 3;
      const streakBonus = streak.rows.length > 0 ? Math.min(streak.rows[0].current_streak * 2, 10) : 0;
      const badgeBonus = Math.min(badges.rows[0].count * 1.5, 8);

      uasPrediction = Math.round(Math.min(100, Math.max(0,
        base + trendBonus + consistencyBonus - weaknessPenalty + streakBonus + badgeBonus
      )));

      if (uasPrediction >= 85) uasCategory = 'Sangat Baik (A)';
      else if (uasPrediction >= 70) uasCategory = 'Baik (B)';
      else if (uasPrediction >= 55) uasCategory = 'Cukup (C)';
      else if (uasPrediction >= 40) uasCategory = 'Kurang (D)';
      else uasCategory = 'Perlu Perhatian (E)';
    }

    const irtData = await pool.query(
      'SELECT theta FROM users WHERE id = $1', [req.params.studentId]
    );
    const theta = irtData.rows[0]?.theta || 0.0;
    const irtCategory = thetaToCategory(theta);

    res.json({
      radarData,
      weaknesses,
      uasPrediction,
      uasCategory,
      stats,
      activity: activity.rows,
      streak: streak.rows[0] || { current_streak: 0, longest_streak: 0, total_reviews: 0 },
      badges: badges.rows[0].count,
      coins: coins.rows[0]?.coins || 0,
      irt: {
        theta,
        category: irtCategory.category,
        label: irtCategory.label,
        color: irtCategory.color
      }
    });
  } catch (err) {
    console.error('🔥 STUDENT INSIGHT ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data insight' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  const { room_id, student_id, score, ai_feedback, material_id } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO analytics (room_id, student_id, score, ai_feedback, material_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [room_id, student_id, score, ai_feedback, material_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 ANALYTICS INSERT ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan analitik' });
  }
});

router.get('/n-gain/:room_id', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    const query = `
      WITH student_tests AS (
        SELECT 
          student_id,
          score,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at ASC) as test_order
        FROM analytics
        WHERE room_id = $1
      )
      SELECT 
        pre.student_id,
        u.full_name as student_name,
        pre.score as pre_score,
        post.score as post_score
      FROM (SELECT * FROM student_tests WHERE test_order = 1) pre
      JOIN (SELECT * FROM student_tests WHERE test_order = 2) post ON pre.student_id = post.student_id
      JOIN users u ON pre.student_id = u.id
    `;
    const result = await pool.query(query, [req.params.room_id]);

    // Use N-Gain service for rich analytics
    const analysis = calculateClassNGain(result.rows);
    const effectiveness = getLearningEffectiveness(analysis.classAverage.gain);

    res.json({
      students: analysis.students,
      classAverage: analysis.classAverage,
      distribution: analysis.distribution,
      effectiveness,
    });
  } catch (err) {
    console.error('🔥 N-GAIN ERROR:', err);
    res.status(500).json({ error: 'Gagal menghitung N-Gain' });
  }
});



// ─── FEAT-001: HEATMAP DATA ───────────────────────────
router.get('/heatmap/:room_id', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        a.student_id, 
        u.full_name as student_name, 
        a.material_id, 
        m.file_name as topic_raw,
        AVG(a.score)::int as avg_score, 
        COUNT(a.id)::int as attempt_count
      FROM analytics a
      JOIN users u ON a.student_id = u.id
      JOIN materials m ON a.material_id = m.id
      WHERE a.room_id = $1
      GROUP BY a.student_id, u.full_name, a.material_id, m.file_name
    `;
    const result = await pool.query(query, [req.params.room_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET HEATMAP ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data heatmap' });
  }
});

// ─── FEAT-001: PDF REPORT EXPORT — Academic Quality ─────────────────────────
router.get('/report/pdf/:room_id', authenticateToken, requireRole('dosen'), async (req, res) => {
  try {
    const roomId = req.params.room_id;

    const roomRes = await pool.query(
      'SELECT r.course_name, r.room_code, u.full_name as dosen_name FROM rooms r JOIN users u ON r.dosen_id = u.id WHERE r.id = $1',
      [roomId]
    );
    if (roomRes.rows.length === 0) return res.status(404).json({ error: 'Room tidak ditemukan' });
    const ownerCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [roomId, req.user.id]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ error: 'Anda tidak memiliki akses ke room ini' });
    const room = roomRes.rows[0];

    // Students with theta
    const studentsRes = await pool.query(`
      SELECT u.id, u.full_name, u.identifier_number as nim,
        COALESCE(u.theta, 0) as theta,
        COALESCE(sa.responses_count, 0) as responses_count,
        sa.last_updated as last_quiz_date
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      LEFT JOIN student_ability sa ON u.id = sa.student_id AND sa.room_id = $1
      WHERE cm.room_id = $1 ORDER BY u.full_name
    `, [roomId]);
    const students = studentsRes.rows;

    // N-Gain: first (pre) and last (post) analytics score per student
    const nGainRes = await pool.query(`
      WITH ranked AS (
        SELECT student_id, score, created_at,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at ASC)  as rn_asc,
          ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY created_at DESC) as rn_desc
        FROM analytics WHERE room_id = $1
      )
      SELECT
        pre.student_id,
        pre.score  as pre_score,
        post.score as post_score,
        pre.created_at  as pre_date,
        post.created_at as post_date
      FROM (SELECT * FROM ranked WHERE rn_asc  = 1) pre
      JOIN (SELECT * FROM ranked WHERE rn_desc = 1) post ON pre.student_id = post.student_id
      WHERE pre.created_at <> post.created_at
    `, [roomId]);

    const nGainMap = {};
    const nGainData = [];
    nGainRes.rows.forEach(r => {
      const gain = r.pre_score >= 100 ? 0 : (r.post_score - r.pre_score) / (100 - r.pre_score);
      const clampedGain = Math.max(-1, Math.min(1, gain));
      const category =
        clampedGain >= 0.7 ? 'Tinggi' :
        clampedGain >= 0.3 ? 'Sedang' :
        clampedGain >= 0   ? 'Rendah' : 'Penurunan';
      nGainMap[r.student_id] = {
        pre: r.pre_score, post: r.post_score,
        gain: parseFloat(clampedGain.toFixed(3)), category,
        pre_date: r.pre_date, post_date: r.post_date
      };
      nGainData.push({ student_id: r.student_id, pre_score: r.pre_score, post_score: r.post_score });
    });

    const { classAverage, distribution } = nGainData.length > 0
      ? require('../services/ngain.service').calculateClassNGain(nGainData.map(d => ({
          student_id: d.student_id, student_name: '', pre_score: d.pre_score, post_score: d.post_score
        })))
      : { classAverage: { gain: 0, label: 'Tidak ada data', totalStudents: 0 }, distribution: {} };

    const { getLearningEffectiveness } = require('../services/ngain.service');
    const effectiveness = getLearningEffectiveness(classAverage.gain);
    const { thetaToCategory } = require('../services/irt.service');

    // ─── Build PDF ────────────────────────────────────────────────
    const doc = new PDFDocument({ size: 'A4', margins: { top: 60, bottom: 60, left: 60, right: 60 }, bufferPages: true });
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ARKON_Laporan_${room.room_code}_${now.getFullYear()}.pdf"`);
    doc.pipe(res);

    // ── COVER PAGE ──────────────────────────────────────
    doc.rect(0, 0, 595, 180).fill('#1a1a2e');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text('ARKON', 60, 50, { align: 'left' });
    doc.fontSize(10).font('Helvetica').fillColor('#a0a0d0')
      .text('Platform Pembelajaran Arsitektur Komputer Berbasis IRT', 60, 78);
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold')
      .text('Laporan Analitik Pembelajaran', 60, 110);
    doc.fontSize(11).font('Helvetica').fillColor('#c0c0e0')
      .text(`Kelas: ${room.course_name}`, 60, 132)
      .text(`Kode Room: ${room.room_code}  ·  Dosen: ${room.dosen_name}`, 60, 148)
      .text(`Tanggal Cetak: ${dateStr}`, 60, 164);

    doc.fillColor('#111111');
    doc.y = 210;

    // ── SECTION 1: Ringkasan Eksekutif ───────────────────
    const thetas = students.map(s => parseFloat(s.theta) || 0);
    const avgTheta = thetas.length ? (thetas.reduce((a, b) => a + b, 0) / thetas.length) : 0;
    const atRisk = thetas.filter(t => t < -1).length;
    const avgThetaCat = thetaToCategory(avgTheta);

    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a2e').text('1. Ringkasan Eksekutif', 60, doc.y);
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
    doc.lineWidth(1);
    doc.moveDown(0.5);

    // Stats grid (2 columns)
    const statY = doc.y;
    const statItems = [
      ['Total Mahasiswa', `${students.length} orang`],
      ['Rata-rata Kemampuan (θ)', `${avgTheta.toFixed(2)} — ${avgThetaCat.label}`],
      ['Mahasiswa Berisiko (θ < −1)', `${atRisk} orang (${students.length ? Math.round(atRisk/students.length*100) : 0}%)`],
      ['Data N-Gain Tersedia', `${nGainData.length} mahasiswa`],
    ];
    doc.fontSize(9).font('Helvetica').fillColor('#333');
    statItems.forEach(([label, value], i) => {
      const x = i % 2 === 0 ? 60 : 310;
      const y = statY + Math.floor(i / 2) * 22;
      doc.font('Helvetica-Bold').text(label + ':', x, y, { continued: true });
      doc.font('Helvetica').text(' ' + value);
    });
    doc.y = statY + Math.ceil(statItems.length / 2) * 22 + 8;

    // N-Gain summary box
    if (nGainData.length > 0) {
      doc.moveDown(0.5);
      const boxY = doc.y;
      const ngColor = classAverage.gain >= 0.7 ? '#10b981' : classAverage.gain >= 0.3 ? '#f59e0b' : '#ef4444';
      doc.rect(60, boxY, 475, 52).fillAndStroke('#f8f9ff', '#e0e0f0');
      doc.fillColor('#1a1a2e').fontSize(9).font('Helvetica-Bold')
        .text('Hasil N-Gain Kelas (Hake, 1999)', 70, boxY + 8);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(ngColor)
        .text(`N-Gain Rata-rata: ${classAverage.gain.toFixed(3)} — Kategori: ${classAverage.label}`, 70, boxY + 22);
      doc.fontSize(8).font('Helvetica').fillColor('#555')
        .text(`Tinggi: ${distribution.high||0}  |  Sedang: ${distribution.medium||0}  |  Rendah: ${distribution.low||0}  |  Penurunan: ${distribution.negative||0}`, 70, boxY + 37);
      doc.y = boxY + 60;
    }

    // ── SECTION 2: Efektivitas Pembelajaran ─────────────
    doc.moveDown(0.8);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a2e').text('2. Efektivitas Pembelajaran');
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
    doc.lineWidth(1);
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor('#333');
    doc.font('Helvetica-Bold').text('Tingkat Efektivitas: ', { continued: true });
    doc.font('Helvetica').text(effectiveness.level);
    doc.moveDown(0.2);
    doc.font('Helvetica-Bold').text('Rekomendasi: ', { continued: true });
    doc.font('Helvetica').text(effectiveness.recommendation, { width: 475 });

    // ── SECTION 3: Tabel Detail Mahasiswa ────────────────
    doc.moveDown(0.8);
    if (doc.y > 600) doc.addPage();
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a2e').text('3. Detail Per Mahasiswa');
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
    doc.lineWidth(1);
    doc.moveDown(0.5);

    // Table header
    const colX2 = { no: 60, name: 78, nim: 215, theta: 295, level: 330, pre: 395, post: 430, ngain: 468, cat: 498 };
    const tableHeaderY = doc.y;
    doc.rect(60, tableHeaderY - 4, 475, 16).fill('#1a1a2e');
    doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
    doc.text('No', colX2.no, tableHeaderY);
    doc.text('Nama Mahasiswa', colX2.name, tableHeaderY);
    doc.text('NIM/NIP', colX2.nim, tableHeaderY);
    doc.text('θ', colX2.theta, tableHeaderY);
    doc.text('Level', colX2.level, tableHeaderY);
    doc.text('Pre', colX2.pre, tableHeaderY);
    doc.text('Post', colX2.post, tableHeaderY);
    doc.text('N-Gain', colX2.ngain, tableHeaderY);
    doc.text('Kat.', colX2.cat, tableHeaderY);
    doc.y = tableHeaderY + 18;

    doc.font('Helvetica').fontSize(7).fillColor('#333');
    students.forEach((s, i) => {
      if (doc.y > 750) {
        doc.addPage();
        doc.y = 60;
        // Repeat header on new page
        const hY = doc.y;
        doc.rect(60, hY - 4, 475, 16).fill('#1a1a2e');
        doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
        ['No','Nama Mahasiswa','NIM/NIP','θ','Level','Pre','Post','N-Gain','Kat.'].forEach((h, hi) => {
          doc.text(h, Object.values(colX2)[hi], hY);
        });
        doc.y = hY + 18;
        doc.font('Helvetica').fontSize(7).fillColor('#333');
      }

      const rowY = doc.y;
      if (i % 2 === 0) doc.rect(60, rowY - 2, 475, 13).fill('#f9f9ff');
      doc.fillColor('#111');
      const ng = nGainMap[s.id];
      const cat = thetaToCategory(parseFloat(s.theta));
      const ngColor2 = ng ? (ng.gain >= 0.7 ? '#10b981' : ng.gain >= 0.3 ? '#f59e0b' : '#ef4444') : '#999';

      doc.text(`${i + 1}`, colX2.no, rowY);
      doc.text((s.full_name || '-').substring(0, 22), colX2.name, rowY);
      doc.text(s.nim || '-', colX2.nim, rowY);
      doc.text(parseFloat(s.theta).toFixed(2), colX2.theta, rowY);
      doc.fillColor(cat.color || '#333').text(cat.label.substring(0, 10), colX2.level, rowY);
      doc.fillColor('#111');
      doc.text(ng ? String(ng.pre) : '-', colX2.pre, rowY);
      doc.text(ng ? String(ng.post) : '-', colX2.post, rowY);
      doc.fillColor(ngColor2).text(ng ? ng.gain.toFixed(2) : '-', colX2.ngain, rowY);
      doc.fillColor('#111').text(ng ? ng.category.substring(0,6) : '-', colX2.cat, rowY);
      doc.y = rowY + 13;
    });

    // ── SECTION 4: Mahasiswa Berisiko (FR-ANALYTICS-005) ────
    const atRiskStudents = students.filter(s => (parseFloat(s.theta) || 0) < -1 && (parseInt(s.responses_count) || 0) < 5);
    if (atRiskStudents.length > 0) {
      doc.moveDown(0.8);
      if (doc.y > 650) doc.addPage();
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a2e').text('4. Mahasiswa Berisiko (Perlu Perhatian)');
      doc.moveDown(0.3);
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#ef4444').lineWidth(2).stroke();
      doc.lineWidth(1).moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#555')
        .text(`${atRiskStudents.length} mahasiswa teridentifikasi berisiko: kemampuan rendah (θ < -1) dan aktivitas minimal (< 5 soal dijawab).`);
      doc.moveDown(0.5);

      // At-risk table
      const arY = doc.y;
      doc.rect(60, arY - 4, 475, 16).fill('#dc2626');
      doc.fillColor('#fff').fontSize(7).font('Helvetica-Bold');
      doc.text('Nama', 70, arY); doc.text('NIM', 215, arY);
      doc.text('Theta (θ)', 300, arY); doc.text('Soal Dijawab', 370, arY); doc.text('Rekomendasi', 440, arY);
      doc.y = arY + 18;

      atRiskStudents.forEach((s, i) => {
        const rowY = doc.y;
        if (i % 2 === 0) doc.rect(60, rowY - 2, 475, 13).fill('#fff5f5');
        doc.fillColor('#111').font('Helvetica').fontSize(7);
        doc.text((s.full_name || '-').substring(0, 22), 70, rowY);
        doc.text(s.nim || '-', 215, rowY);
        doc.fillColor('#dc2626').text(parseFloat(s.theta).toFixed(2), 300, rowY);
        doc.fillColor('#111').text(String(s.responses_count || 0), 370, rowY);
        doc.text('Bimbingan khusus', 440, rowY);
        doc.y = rowY + 13;
      });
      doc.moveDown(0.5);
    }

    // ── SECTION 5: Catatan Metodologi ───────────────────
    doc.moveDown(1.5);
    if (doc.y > 680) doc.addPage();
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a2e').text('5. Catatan Metodologi');
    doc.moveDown(0.3);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#6366f1').lineWidth(2).stroke();
    doc.lineWidth(1).moveDown(0.5);
    doc.fontSize(8).font('Helvetica').fillColor('#555');
    const notes = [
      '• Kemampuan mahasiswa (θ) diestimasi menggunakan IRT Rasch Model 1-PL dengan algoritma Newton-Raphson MLE (15 iterasi).',
      '• N-Gain dihitung menggunakan formula Hake (1999): g = (PostTest − PreTest) / (MaxScore − PreTest).',
      '• Interpretasi N-Gain: Tinggi (g ≥ 0.7), Sedang (0.3 ≤ g < 0.7), Rendah (g < 0.3).',
      '• Data pre-test diambil dari entri analytics pertama per mahasiswa, post-test dari entri terakhir.',
      '• Mahasiswa tanpa data N-Gain belum memiliki dua sesi quiz yang tercatat di sistem.'
    ];
    notes.forEach(n => { doc.text(n, 60, doc.y, { width: 475 }); doc.moveDown(0.3); });

    // ── PAGE NUMBERS ─────────────────────────────────────
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor('#999').font('Helvetica')
        .text(`Halaman ${i + 1} dari ${pageCount}  ·  ARKON Analytics Engine v1.0  ·  ${dateStr}`,
          60, 820, { align: 'center', width: 475 });
    }

    doc.end();
  } catch (err) {
    console.error('🔥 PDF REPORT ERROR:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Gagal membuat laporan PDF' });
  }
});

// ─── OVERVIEW STATISTICS ──────────────────────────────────────────────────
router.get('/overview/:room_id', authenticateToken, async (req, res) => {
  try {
    const roomId = req.params.room_id;
    
    // Student Count
    const studentCountRes = await pool.query(
      'SELECT COUNT(*)::int as count FROM class_members WHERE room_id = $1',
      [roomId]
    );

    // Active Activity using coin_transactions
    const activeActivityRes = await pool.query(`
      SELECT COUNT(*)::int as count FROM coin_transactions 
      WHERE student_id IN (SELECT student_id FROM class_members WHERE room_id = $1)
      AND created_at > NOW() - INTERVAL '7 days'
    `, [roomId]);

    // Average XP from achievements
    const avgXpRes = await pool.query(`
      SELECT COALESCE(AVG(score), 0)::int as avg_xp FROM (
        SELECT u.id, 
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
          ), 0) as score
        FROM class_members cm
        JOIN users u ON cm.student_id = u.id
        LEFT JOIN achievements a ON u.id = a.student_id
        WHERE cm.room_id = $1
        GROUP BY u.id
      ) sub
    `, [roomId]);

    res.json({
      student_count: studentCountRes.rows[0].count,
      active_activities: activeActivityRes.rows[0].count,
      avg_xp: avgXpRes.rows[0].avg_xp
    });
  } catch (err) {
    console.error('🔥 OVERVIEW STATS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil overview stats' });
  }
});

router.get('/:room_id', authenticateToken, async (req, res) => {
  try {
    const query = `SELECT a.*, u.full_name as student_name, u.identifier_number as nim FROM analytics a JOIN users u ON a.student_id = u.id WHERE a.room_id = $1 ORDER BY a.created_at DESC`;
    const result = await pool.query(query, [req.params.room_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET ANALYTICS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data analitik' });
  }
});

module.exports = router;
