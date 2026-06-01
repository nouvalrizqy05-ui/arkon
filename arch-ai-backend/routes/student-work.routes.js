const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ─── SAVE / UPDATE STUDENT WORK ─────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  const { activity_id, room_id, student_id, work_type, work_data, score, score_breakdown } = req.body;
  try {
    // Check if work already exists for this student + activity
    let existing = null;
    if (activity_id) {
      const check = await pool.query(
        'SELECT id FROM student_work WHERE activity_id = $1 AND student_id = $2',
        [activity_id, student_id]
      );
      existing = check.rows[0];
    }

    if (existing) {
      // Update existing work (auto-save)
      const result = await pool.query(
        `UPDATE student_work SET work_data = $1, score = $2, score_breakdown = $3, 
         work_type = COALESCE($4, work_type), updated_at = NOW()
         WHERE id = $5 RETURNING *`,
        [JSON.stringify(work_data || {}), score || null, JSON.stringify(score_breakdown || {}),
         work_type, existing.id]
      );
      res.json(result.rows[0]);
    } else {
      // Create new work entry
      const result = await pool.query(
        `INSERT INTO student_work (activity_id, room_id, student_id, work_type, work_data, score, score_breakdown)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [activity_id || null, room_id, student_id, work_type || 'assembly',
         JSON.stringify(work_data || {}), score || null, JSON.stringify(score_breakdown || {})]
      );
      res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('🔥 SAVE STUDENT WORK ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan karya' });
  }
});

// ─── GET ALL WORK IN A ROOM (Dosen view) ─────────────────────────────
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sw.*, u.full_name as student_name, u.identifier_number as nim,
       a.title as activity_title, a.activity_type
       FROM student_work sw
       LEFT JOIN users u ON sw.student_id = u.id
       LEFT JOIN activities a ON sw.activity_id = a.id
       WHERE sw.room_id = $1
       ORDER BY sw.updated_at DESC`,
      [req.params.roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET ROOM WORK ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil karya mahasiswa' });
  }
});

// ─── GET STUDENT'S OWN WORK ─────────────────────────────
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  const { room_id } = req.query;
  try {
    let query = 'SELECT * FROM student_work WHERE student_id = $1';
    const params = [req.params.studentId];

    if (room_id) {
      query += ' AND room_id = $2';
      params.push(room_id);
    }

    query += ' ORDER BY updated_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 GET STUDENT WORK ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil karya' });
  }
});

// ─── GET SINGLE WORK DETAIL ─────────────────────────────
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sw.*, u.full_name as student_name,
       a.title as activity_title, a.activity_type
       FROM student_work sw
       LEFT JOIN users u ON sw.student_id = u.id
       LEFT JOIN activities a ON sw.activity_id = a.id
       WHERE sw.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Karya tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 GET WORK DETAIL ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil detail karya' });
  }
});

// ─── SUBMIT WORK (Mahasiswa submit to Dosen) ─────────────────────────────
router.put('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE student_work SET is_submitted = true, submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Karya tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 SUBMIT WORK ERROR:', err);
    res.status(500).json({ error: 'Gagal mengirim karya' });
  }
});

// ─── GRADE WORK (Dosen grade/review student work) ─────────────────────────────
router.put('/:id/grade', authenticateToken, async (req, res) => {
  const { grade, review_status, feedback } = req.body;
  // review_status: 'graded' | 'revision_needed' | 'approved'
  if (!review_status || !['graded', 'revision_needed', 'approved'].includes(review_status)) {
    return res.status(400).json({ error: 'review_status harus salah satu dari: graded, revision_needed, approved' });
  }
  if (grade !== undefined && grade !== null && (grade < 0 || grade > 100)) {
    return res.status(400).json({ error: 'Grade harus antara 0-100' });
  }

  try {
    const result = await pool.query(
      `UPDATE student_work SET 
        grade = $1, review_status = $2, feedback = $3,
        reviewed_by = $4, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [grade || null, review_status, feedback || null, req.user.id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Karya tidak ditemukan' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 GRADE WORK ERROR:', err);
    res.status(500).json({ error: 'Gagal menilai karya' });
  }
});

module.exports = router;

