const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Security: Whitelist for dynamic SQL field names (BUG-01 fix)
const ALLOWED_SCORE_FIELDS = ['player1_score', 'player2_score'];
const ALLOWED_PLAYER_FIELDS = ['player1_id', 'player2_id'];

// Create tournament (dosen only)
router.post('/create', authenticateToken, async (req, res) => {
  const { room_id, title, max_players } = req.body;
  if (!room_id || !title) return res.status(400).json({ error: 'room_id dan title wajib' });

  try {
    // Verify dosen owns the room
    console.log(`🔍 [Tournament Debug] room_id: ${room_id}, dosen_id: ${req.user.id}`);
    const roomCheck = await pool.query('SELECT id FROM rooms WHERE id = $1 AND dosen_id = $2', [room_id, req.user.id]);
    
    if (roomCheck.rows.length === 0) {
      console.warn(`⚠️ [Tournament Debug] Room check failed for room ${room_id} and dosen ${req.user.id}`);
      return res.status(403).json({ error: 'Anda bukan dosen kelas ini atau room tidak ditemukan.' });
    }

    const result = await pool.query(
      'INSERT INTO tournaments (room_id, dosen_id, title, max_players) VALUES ($1, $2, $3, $4) RETURNING *',
      [room_id, req.user.id, title, max_players || 16]
    );
    console.log(`🏆 [Tournament] Created: ${title} in room ${room_id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('🔥 TOURNAMENT CREATE ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat turnamen', detail: err.message });
  }
});

// Join tournament (student)
router.post('/join', authenticateToken, async (req, res) => {
  const { tournament_id } = req.body;
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [tournament_id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Turnamen tidak ditemukan' });
    if (tournament.rows[0].status !== 'registration') return res.status(400).json({ error: 'Pendaftaran sudah ditutup' });

    // Verify student is in the same room as the tournament
    const roomMember = await pool.query(
      'SELECT id FROM class_members WHERE room_id = $1 AND student_id = $2',
      [tournament.rows[0].room_id, req.user.id]
    );
    if (roomMember.rows.length === 0) {
      return res.status(403).json({ error: 'Anda bukan anggota kelas ini. Silakan gabung ke kelas dulu.' });
    }

    // Check player count
    const count = await pool.query('SELECT COUNT(*)::int as count FROM tournament_participants WHERE tournament_id = $1', [tournament_id]);
    if (count.rows[0].count >= tournament.rows[0].max_players) return res.status(400).json({ error: 'Turnamen sudah penuh' });

    // Check if already joined
    const existing = await pool.query('SELECT id FROM tournament_participants WHERE tournament_id = $1 AND student_id = $2', [tournament_id, req.user.id]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Sudah terdaftar' });

    const seed = count.rows[0].count + 1;
    await pool.query(
      'INSERT INTO tournament_participants (tournament_id, student_id, seed) VALUES ($1, $2, $3)',
      [tournament_id, req.user.id, seed]
    );

    // Broadcast update
    if (global.io) {
      global.io.to(tournament.rows[0].room_id).emit('tournament:update', { tournament_id, action: 'player_joined' });
    }

    res.json({ message: 'Berhasil mendaftar turnamen', seed });
  } catch (err) {
    console.error('🔥 TOURNAMENT JOIN ERROR:', err);
    res.status(500).json({ error: 'Gagal bergabung turnamen' });
  }
});

// List tournaments in a room
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
        (SELECT COUNT(*)::int FROM tournament_participants WHERE tournament_id = t.id) as player_count,
        u.full_name as dosen_name
      FROM tournaments t
      LEFT JOIN users u ON t.dosen_id = u.id
      WHERE t.room_id = $1 ORDER BY t.created_at DESC
    `, [req.params.roomId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar turnamen' });
  }
});

// Get bracket data
router.get('/:id/bracket', authenticateToken, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    if (tournament.rows.length === 0) return res.status(404).json({ error: 'Turnamen tidak ditemukan' });

    const participants = await pool.query(`
      SELECT tp.*, u.full_name as player_name
      FROM tournament_participants tp JOIN users u ON tp.student_id = u.id
      WHERE tp.tournament_id = $1 ORDER BY tp.seed
    `, [req.params.id]);

    const matches = await pool.query(`
      SELECT tm.*, 
        p1.full_name as player1_name, p2.full_name as player2_name,
        w.full_name as winner_name
      FROM tournament_matches tm
      LEFT JOIN users p1 ON tm.player1_id = p1.id
      LEFT JOIN users p2 ON tm.player2_id = p2.id
      LEFT JOIN users w ON tm.winner_id = w.id
      WHERE tm.tournament_id = $1 ORDER BY tm.round, tm.match_order
    `, [req.params.id]);

    res.json({
      tournament: tournament.rows[0],
      participants: participants.rows,
      matches: matches.rows
    });
  } catch (err) {
    console.error('🔥 BRACKET ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil bracket' });
  }
});

// Start tournament — generate bracket (dosen only)
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const tournament = await pool.query('SELECT * FROM tournaments WHERE id = $1 AND dosen_id = $2', [req.params.id, req.user.id]);
    if (tournament.rows.length === 0) return res.status(403).json({ error: 'Bukan dosen turnamen ini' });
    if (tournament.rows[0].status !== 'registration') return res.status(400).json({ error: 'Turnamen sudah dimulai' });

    const participants = await pool.query(
      'SELECT * FROM tournament_participants WHERE tournament_id = $1 ORDER BY seed', [req.params.id]
    );

    const playerCount = participants.rows.length;
    if (playerCount < 2) return res.status(400).json({ error: 'Minimal 2 pemain untuk memulai turnamen' });

    // Pad to nearest power of 2
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));
    const totalRounds = Math.log2(bracketSize);

    // Generate Round 1 matches
    const players = participants.rows.map(p => p.student_id);
    // Pad with nulls (byes)
    while (players.length < bracketSize) players.push(null);

    for (let i = 0; i < bracketSize / 2; i++) {
      const p1 = players[i];
      const p2 = players[bracketSize - 1 - i];
      
      // If one player is bye, auto-advance
      const isBye = !p1 || !p2;
      const winnerId = isBye ? (p1 || p2) : null;

      await pool.query(`
        INSERT INTO tournament_matches (tournament_id, round, match_order, player1_id, player2_id, winner_id, status)
        VALUES ($1, 1, $2, $3, $4, $5, $6)
      `, [req.params.id, i + 1, p1, p2, winnerId, isBye ? 'completed' : 'pending']);
    }

    // Generate placeholder matches for subsequent rounds
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = bracketSize / Math.pow(2, round);
      for (let i = 0; i < matchesInRound; i++) {
        await pool.query(
          'INSERT INTO tournament_matches (tournament_id, round, match_order, status) VALUES ($1, $2, $3, $4)',
          [req.params.id, round, i + 1, 'pending']
        );
      }
    }

    await pool.query('UPDATE tournaments SET status = $1 WHERE id = $2', ['in_progress', req.params.id]);

    if (global.io) {
      global.io.to(tournament.rows[0].room_id).emit('tournament:update', { tournament_id: req.params.id, action: 'started' });
    }

    res.json({ message: 'Turnamen dimulai!', rounds: totalRounds, bracket_size: bracketSize });
  } catch (err) {
    console.error('🔥 TOURNAMENT START ERROR:', err);
    res.status(500).json({ error: 'Gagal memulai turnamen' });
  }
});

// Start a duel match — generate questions and notify players
router.post('/match/:matchId/start', authenticateToken, async (req, res) => {
  try {
    const match = await pool.query(`
      SELECT tm.*, t.room_id, t.dosen_id 
      FROM tournament_matches tm 
      JOIN tournaments t ON tm.tournament_id = t.id
      WHERE tm.id = $1
    `, [req.params.matchId]);
    
    if (match.rows.length === 0) return res.status(404).json({ error: 'Match tidak ditemukan' });
    if (match.rows[0].dosen_id !== req.user.id) return res.status(403).json({ error: 'Bukan dosen turnamen' });

    // Generate 5 duel questions from AI cache or hardcoded
    const duelQuestions = [
      { question: "Apa fungsi utama ALU dalam CPU?", options: ["Menyimpan data", "Melakukan operasi aritmatika dan logika", "Mengatur aliran data", "Menampilkan output"], correct: 1, time: 15 },
      { question: "Register yang menyimpan alamat instruksi berikutnya disebut?", options: ["ACC", "MAR", "PC (Program Counter)", "MDR"], correct: 2, time: 15 },
      { question: "Berapa bit dalam 1 byte?", options: ["4 bit", "8 bit", "16 bit", "32 bit"], correct: 1, time: 10 },
      { question: "Apa kepanjangan dari RAM?", options: ["Read Access Memory", "Random Access Memory", "Rapid Access Module", "Read And Modify"], correct: 1, time: 10 },
      { question: "Pipeline CPU terdiri dari tahap?", options: ["Fetch, Execute", "Fetch, Decode, Execute", "Load, Store", "Read, Write, Execute"], correct: 1, time: 15 }
    ];

    await pool.query(
      'UPDATE tournament_matches SET status = $1, questions = $2, started_at = NOW() WHERE id = $3',
      ['active', JSON.stringify(duelQuestions), req.params.matchId]
    );

    // Notify both players via socket
    const roomId = match.rows[0].room_id;
    if (global.io) {
      global.io.to(roomId).emit('tournament:duel-start', {
        match_id: req.params.matchId,
        player1_id: match.rows[0].player1_id,
        player2_id: match.rows[0].player2_id,
        questions: duelQuestions,
        tournament_id: match.rows[0].tournament_id
      });
    }

    res.json({ message: 'Duel dimulai!', match_id: req.params.matchId });
  } catch (err) {
    console.error('🔥 DUEL START ERROR:', err);
    res.status(500).json({ error: 'Gagal memulai duel' });
  }
});

// Submit duel answer
router.post('/match/:matchId/answer', authenticateToken, async (req, res) => {
  const { question_index, selected_index, answer_time_ms } = req.body;
  try {
    const match = await pool.query('SELECT * FROM tournament_matches WHERE id = $1', [req.params.matchId]);
    if (match.rows.length === 0) return res.status(404).json({ error: 'Match tidak ditemukan' });
    if (match.rows[0].status !== 'active') return res.status(400).json({ error: 'Match belum aktif' });

    const questions = match.rows[0].questions;
    const question = questions[question_index];
    if (!question) return res.status(400).json({ error: 'Soal tidak ditemukan' });

    const isCorrect = selected_index === question.correct;
    const timeBonus = Math.max(0, 1 - (answer_time_ms / (question.time * 1000)));
    const score = isCorrect ? Math.round(100 + (100 * timeBonus)) : 0;

    // Update score — with whitelist validation (BUG-01 fix)
    const isPlayer1 = req.user.id === match.rows[0].player1_id;
    const scoreField = isPlayer1 ? 'player1_score' : 'player2_score';
    
    if (!ALLOWED_SCORE_FIELDS.includes(scoreField)) {
      return res.status(400).json({ error: 'Invalid score field' });
    }
    
    await pool.query(
      `UPDATE tournament_matches SET ${scoreField} = ${scoreField} + $1 WHERE id = $2`,
      [score, req.params.matchId]
    );

    res.json({ is_correct: isCorrect, score, total_added: score });
  } catch (err) {
    console.error('🔥 DUEL ANSWER ERROR:', err);
    res.status(500).json({ error: 'Gagal menyimpan jawaban duel' });
  }
});

// End match and determine winner
router.post('/match/:matchId/end', authenticateToken, async (req, res) => {
  try {
    const match = await pool.query(`
      SELECT tm.*, t.room_id, t.id as tid 
      FROM tournament_matches tm JOIN tournaments t ON tm.tournament_id = t.id 
      WHERE tm.id = $1
    `, [req.params.matchId]);
    if (match.rows.length === 0) return res.status(404).json({ error: 'Match tidak ditemukan' });

    const m = match.rows[0];
    const winnerId = m.player1_score >= m.player2_score ? m.player1_id : m.player2_id;
    const loserId = winnerId === m.player1_id ? m.player2_id : m.player1_id;

    // Update match
    await pool.query(
      'UPDATE tournament_matches SET status = $1, winner_id = $2, ended_at = NOW() WHERE id = $3',
      ['completed', winnerId, req.params.matchId]
    );

    // Mark loser as eliminated
    await pool.query(
      'UPDATE tournament_participants SET eliminated = true WHERE tournament_id = $1 AND student_id = $2',
      [m.tid, loserId]
    );

    // Advance winner to next round
    const nextRound = m.round + 1;
    const nextMatchOrder = Math.ceil(m.match_order / 2);
    const isPlayer1Slot = m.match_order % 2 !== 0;

    const nextMatch = await pool.query(
      'SELECT id FROM tournament_matches WHERE tournament_id = $1 AND round = $2 AND match_order = $3',
      [m.tid, nextRound, nextMatchOrder]
    );

    if (nextMatch.rows.length > 0) {
      const updateField = isPlayer1Slot ? 'player1_id' : 'player2_id';
      
      if (!ALLOWED_PLAYER_FIELDS.includes(updateField)) {
        return res.status(400).json({ error: 'Invalid player field' });
      }
      
      await pool.query(
        `UPDATE tournament_matches SET ${updateField} = $1 WHERE id = $2`,
        [winnerId, nextMatch.rows[0].id]
      );
    } else {
      // This was the final — tournament complete!
      await pool.query('UPDATE tournaments SET status = $1 WHERE id = $2', ['completed', m.tid]);
      
      // 1st Place: Champion badge + 1000 coins
      await pool.query(
        'INSERT INTO achievements (student_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [winnerId, 'tournament_champion']
      );
      await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + 1000 WHERE id = $1', [winnerId]);
      await pool.query(
        'INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, 1000, $2)',
        [winnerId, 'Tournament Champion Reward']
      );

      // 2nd Place: Runner-up + 500 coins
      await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + 500 WHERE id = $1', [loserId]);
      await pool.query(
        'INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, 500, $2)',
        [loserId, 'Tournament Runner-up Reward']
      );

      // 3rd/4th Place: Semi-finalists + 250 coins
      if (m.round > 1) {
        const semiFinals = await pool.query('SELECT winner_id, player1_id, player2_id FROM tournament_matches WHERE tournament_id = $1 AND round = $2', [m.tid, m.round - 1]);
        for (let semi of semiFinals.rows) {
          const semiLoser = semi.winner_id === semi.player1_id ? semi.player2_id : semi.player1_id;
          if (semiLoser) {
            await pool.query('UPDATE users SET coins = COALESCE(coins, 0) + 250 WHERE id = $1', [semiLoser]);
            await pool.query(
              'INSERT INTO coin_transactions (student_id, amount, reason) VALUES ($1, 250, $2)',
              [semiLoser, 'Tournament Semi-finalist Reward']
            );
          }
        }
      }
    }

    if (global.io) {
      global.io.to(m.room_id).emit('tournament:update', { 
        tournament_id: m.tid, action: 'match_ended', match_id: req.params.matchId, winner_id: winnerId 
      });
    }

    res.json({ message: 'Match selesai', winner_id: winnerId });
  } catch (err) {
    console.error('🔥 MATCH END ERROR:', err);
    res.status(500).json({ error: 'Gagal menyelesaikan match' });
  }
});

module.exports = router;
