/**
 * ARKON AI Routes — Gemini Integration for Educational AI Features
 * 
 * Provides:
 * - AI-powered feedback on student assembly work
 * - Adaptive hint system for quiz questions
 * - AI summary generation for analytics dashboards
 * 
 * All endpoints require JWT authentication.
 * Uses Google Gemini 2.0 Flash for low-latency educational AI.
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { analyzePcBuild, generateAdaptiveHint, generateLearningPath, generateAnalyticsSummary } = require('../services/heuristic.service');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 5, // max 5 AI calls per menit per IP
  message: { error: 'Terlalu banyak permintaan AI. Tunggu sebentar.' }
});

// ──────────────────────────────────────────
// GEMINI AI CLIENT (lazy-loaded)
// ──────────────────────────────────────────
let genAI = null;

function getGenAI() {
  if (!genAI) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ [AI] GEMINI_API_KEY not configured — AI features disabled');
        return null;
      }
      genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      console.log('✅ [AI] Gemini AI initialized successfully');
    } catch (err) {
      console.error('❌ [AI] Failed to initialize Gemini:', err.message);
      return null;
    }
  }
  return genAI;
}

/**
 * Get available Gemini model names from env, with fallbacks
 */
function getModelNames() {
  const models = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').split(',').map(m => m.trim());
  return models;
}

/**
 * TASK-FEAT-004: Standardized AI unavailable response
 * Frontend should detect this error code to show fallback UI
 */
const AI_UNAVAILABLE_RESPONSE = {
  error: 'AI_UNAVAILABLE',
  message: 'Fitur AI sementara tidak tersedia. Platform tetap berfungsi normal tanpa AI.',
};

/**
 * Call Gemini with automatic model rotation on failure
 * TASK-FEAT-004: Never throws — returns null on failure.
 * Callers should check for null and use AI_UNAVAILABLE_RESPONSE.
 */
async function callGemini(prompt, maxRetries = 2) {
  const ai = getGenAI();
  if (!ai) {
    console.warn('⚠️ [AI] Gemini not configured — returning null');
    return null;
  }

  const modelNames = getModelNames();
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const modelName = modelNames[attempt % modelNames.length];
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [AI] Model ${modelName} failed (attempt ${attempt + 1}):`, err.message);
      // If quota error or rate limit, try next model
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        continue;
      }
      // For other errors (network, etc.), also continue to next model
      continue;
    }
  }

  console.error('❌ [AI] All models exhausted:', lastError?.message);
  return null;
}

/**
 * Helper: Send AI response or graceful fallback
 */
function sendAIResponse(res, result, extraFields = {}) {
  if (result === null) {
    return res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
  return res.json({ ...extraFields, generated_at: new Date().toISOString() });
}

// ──────────────────────────────────────────
// ENDPOINT: Analyze Student Assembly Work
// ──────────────────────────────────────────
router.post('/analyze-work', authenticateToken, aiLimiter, async (req, res) => {
  const { workData, activityTitle } = req.body;

  if (!workData) {
    return res.status(400).json({ error: 'Data pekerjaan (workData) wajib disertakan.' });
  }

  try {
    // Sanitasi data perakitan untuk menghindari prompt injection & token bloated
    const sanitizedWorkData = {
      components: Array.isArray(workData.components) ? workData.components.slice(0, 20) : [],
      issues: Array.isArray(workData.issues) ? workData.issues.slice(0, 10) : [],
      score: typeof workData.score === 'number' ? workData.score : null
    };

    // Sanitasi activityTitle (max 50 chars, hilangkan special chars berbahaya)
    const sanitizedTitle = (activityTitle || 'Perakitan PC Virtual').toString().replace(/[^\w\s-]/g, '').substring(0, 50);

    const prompt = `Kamu adalah dosen Arsitektur Komputer yang ahli dan suportif. Analisis hasil perakitan PC berikut dan berikan feedback konstruktif dalam Bahasa Indonesia (maksimal 150 kata):

Aktivitas: ${sanitizedTitle}
Data Perakitan: ${JSON.stringify(sanitizedWorkData)}

Berikan analisis dalam format:
1) ✅ Apa yang sudah benar
2) ⚠️ Apa yang perlu diperbaiki  
3) 💡 Satu tips teknis untuk meningkatkan pemahaman

Gunakan bahasa yang mudah dipahami mahasiswa. Jangan terlalu formal.`;

    const feedback = await callGemini(prompt);
    if (feedback === null) {
      console.log('⚠️ [AI] Limit reached, falling back to heuristic for analyze-work');
      const fallbackFeedback = analyzePcBuild(sanitizedWorkData.components);
      return res.json({ feedback: fallbackFeedback, model: 'heuristic', generated_at: new Date().toISOString() });
    }
    res.json({ feedback, model: 'gemini', generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[AI] Analyze work error:', err.message);
    res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
});

// ──────────────────────────────────────────
// ENDPOINT: Adaptive Hint for Quiz Questions
// ──────────────────────────────────────────
router.post('/adaptive-hint', authenticateToken, aiLimiter, async (req, res) => {
  const { questionText, studentTheta, wrongCount, wrongAnswers } = req.body;

  if (!questionText) {
    return res.status(400).json({ error: 'Teks soal (questionText) wajib disertakan.' });
  }

  try {
    const abilityLevel = studentTheta >= 1 ? 'tinggi' : studentTheta >= 0 ? 'menengah' : 'dasar';
    const hintLevel = wrongCount >= 3 ? 'sangat detail' : wrongCount >= 2 ? 'cukup detail' : 'subtle';

    // Sanitasi teks soal dari potensi injection
    const sanitizedQuestion = questionText.toString().substring(0, 500).replace(/[<>'"]/g, '');

    // Sanitasi wrong answers jika ada
    let wrongContext = '';
    if (Array.isArray(wrongAnswers) && wrongAnswers.length > 0) {
      const sanitizedWrong = wrongAnswers.slice(0, 5).map(a => a.toString().substring(0, 200).replace(/[<>'"]/g, ''));
      wrongContext = `\nMahasiswa sudah pernah memilih jawaban salah berikut: ${sanitizedWrong.join(', ')}. Arahkan hint menjauhi jawaban-jawaban tersebut dan fokus ke konsep yang benar.`;
    }

    const prompt = `Kamu adalah tutor Arsitektur Komputer. Seorang mahasiswa dengan kemampuan level ${abilityLevel} (θ=${studentTheta?.toFixed(2) || '0.00'}) sedang kesulitan menjawab soal berikut:

"${sanitizedQuestion}"

Mahasiswa sudah menjawab salah ${wrongCount || 1} kali.${wrongContext}

Berikan hint yang ${hintLevel} dalam Bahasa Indonesia:
- Maksimal 2 kalimat
- JANGAN berikan jawaban langsung
- Arahkan ke konsep yang benar
- Sesuaikan kompleksitas bahasa dengan level kemampuan mahasiswa`;

    const hint = await callGemini(prompt);
    if (hint === null) {
      console.log('⚠️ [AI] Limit reached, falling back to heuristic for adaptive-hint');
      const fallbackHint = generateAdaptiveHint(sanitizedQuestion, studentTheta, wrongCount);
      return res.json({ hint: fallbackHint, ability_level: abilityLevel, model: 'heuristic', generated_at: new Date().toISOString() });
    }
    res.json({ hint, ability_level: abilityLevel, model: 'gemini', generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[AI] Adaptive hint error:', err.message);
    res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
});

// ──────────────────────────────────────────
// ENDPOINT: AI Analytics Summary for Dosen
// ──────────────────────────────────────────
router.post('/analytics-summary', authenticateToken, requireRole('dosen'), aiLimiter, async (req, res) => {
  const { classData, roomName } = req.body;

  if (!classData) {
    return res.status(400).json({ error: 'Data kelas (classData) wajib disertakan.' });
  }

  try {
    // Sanitasi input
    const sanitizedRoomName = (roomName || 'Arsitektur Komputer').toString().replace(/[^\w\s-]/g, '').substring(0, 50);
    const sanitizedClassData = {
      totalStudents: parseInt(classData.totalStudents) || 0,
      avgTheta: parseFloat(classData.avgTheta) || 0,
      atRisk: parseInt(classData.atRisk) || 0,
      avgNGain: parseFloat(classData.avgNGain) || 0,
      distribution: typeof classData.distribution === 'object' ? classData.distribution : {}
    };

    const prompt = `Kamu adalah analis pendidikan. Berikan ringkasan analitik dalam Bahasa Indonesia (maks 200 kata) berdasarkan data kelas berikut:

Kelas: ${sanitizedRoomName}
Data Analitik:
- Jumlah mahasiswa: ${sanitizedClassData.totalStudents}
- Rata-rata θ (IRT): ${sanitizedClassData.avgTheta.toFixed(2)}
- Mahasiswa perlu perhatian (θ < -1): ${sanitizedClassData.atRisk}
- N-Gain rata-rata: ${sanitizedClassData.avgNGain.toFixed(3)}
- Distribusi kemampuan: ${JSON.stringify(sanitizedClassData.distribution)}

Berikan:
1) 📊 Ringkasan kondisi kelas secara umum
2) 🎯 Area yang perlu perhatian khusus
3) 💡 Rekomendasi strategi pengajaran (berdasarkan data IRT & N-Gain)
4) 🏆 Highlight positif yang bisa disampaikan ke mahasiswa`;

    const summary = await callGemini(prompt);
    if (summary === null) {
      console.log('⚠️ [AI] Limit reached, falling back to heuristic for analytics-summary');
      const fallbackSummary = generateAnalyticsSummary(sanitizedClassData, sanitizedRoomName);
      return res.json({ summary: fallbackSummary, model: 'heuristic', generated_at: new Date().toISOString() });
    }
    res.json({ summary, model: 'gemini', generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[AI] Analytics summary error:', err.message);
    res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
});

// ──────────────────────────────────────────
// ENDPOINT: Check AI Service Status
// ──────────────────────────────────────────
router.get('/status', authenticateToken, (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  const models = getModelNames();
  res.json({
    available: hasKey,
    models: hasKey ? models : [],
    message: hasKey ? 'AI service aktif dan siap digunakan.' : 'GEMINI_API_KEY belum dikonfigurasi.',
  });
});

// ──────────────────────────────────────────
// ENDPOINT: AI Adaptive Learning Path
// ──────────────────────────────────────────
router.post('/learning-path', authenticateToken, aiLimiter, async (req, res) => {
  const { studentId, roomId, theta } = req.body;

  if (!studentId || !roomId) {
    return res.status(400).json({ error: 'studentId dan roomId wajib disertakan.' });
  }

  try {
    const studentTheta = typeof theta === 'number' ? theta : 0;
    const abilityLevel = studentTheta < -1 ? 'pemula' : studentTheta < 1 ? 'menengah' : 'mahir';

    const prompt = `Mahasiswa dengan skor kemampuan IRT theta=${studentTheta.toFixed(2)} (skala -4 s/d +4, kategori: ${abilityLevel}) sedang belajar Arsitektur Komputer. Rekomendasikan 3 topik yang sebaiknya dipelajari selanjutnya dari daftar berikut: [Pipeline CPU, Cache Memory, Virtual Memory, Instruction Set, ALU Operations, Branch Prediction, RISC vs CISC, Memory Hierarchy, Assembly Basics].
    
Berikan respons dalam format JSON murni tanpa markdown \`\`\`json:
{
  "recommendations": [
    { "topic": "Nama Topik", "reason": "Alasan singkat 1 kalimat mengapa cocok untuk level theta ini" }
  ]
}`;

    const rawResponse = await callGemini(prompt);
    if (rawResponse === null) {
      console.log('⚠️ [AI] Limit reached, falling back to heuristic for learning-path');
      const fallbackPath = generateLearningPath(studentTheta);
      return res.json({ data: { recommendations: fallbackPath }, theta: studentTheta, model: 'heuristic', generated_at: new Date().toISOString() });
    }
    
    // Bersihkan potensi markdown json dari output Gemini
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    res.json({ data: JSON.parse(cleanJson), theta: studentTheta, model: 'gemini', generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[AI] Learning path error:', err.message);
    res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
});

// ─── PERSONALIZED AI TUTOR — Phase 3 Feature ─────────────────────────────
// Context-aware explanations based on wrong answer + student theta + topic
router.post('/personalized-tutor', authenticateToken, aiLimiter, async (req, res) => {
  try {
    const { question_text, wrong_answer, correct_answer, topic, explanation } = req.body;
    const studentId = req.user.id;

    if (!question_text) {
      return res.status(400).json({ error: 'question_text wajib diisi.' });
    }

    // Get student theta for personalized level
    let theta = 0;
    try {
      const thetaRes = await pool.query('SELECT theta FROM users WHERE id = $1', [studentId]);
      theta = thetaRes.rows[0]?.theta || 0;
    } catch { /* use default theta = 0 */ }

    const level = theta < -1 ? 'pemula (baru belajar dasar)' : theta < 0 ? 'dibawah rata-rata (perlu penguatan fondasi)' : theta < 1 ? 'menengah (siap topik lebih kompleks)' : 'mahir (bisa eksplorasi topik advanced)';

    const prompt = `Kamu adalah tutor Arsitektur Komputer yang ramah dan adaptif.

Mahasiswa (level: ${level}, theta IRT: ${theta.toFixed(2)}) baru saja menjawab soal dengan **salah**.

**Soal:** ${question_text}
**Jawaban mahasiswa:** ${wrong_answer || 'tidak menjawab'}
**Jawaban benar:** ${correct_answer || 'tidak diketahui'}
**Topik:** ${topic || 'Arsitektur Komputer'}
${explanation ? `**Penjelasan singkat soal:** ${explanation}` : ''}

Tugas kamu:
1. Jelaskan dengan **bahasa Indonesia yang mudah** kenapa jawaban benar itu benar (max 3 kalimat, sesuai level mahasiswa)
2. Berikan **1 analogi atau contoh nyata** yang relevan
3. Berikan **1 pertanyaan refleksi** untuk memperkuat pemahaman
4. Rekomendasikan **1 subtopik** yang perlu dipelajari lebih lanjut

Respons dalam format JSON murni tanpa markdown:
{
  "explanation": "...",
  "analogy": "...",
  "reflection_question": "...",
  "study_recommendation": "...",
  "encouragement": "pesan motivasi singkat"
}`;

    const rawResponse = await callGemini(prompt);

    if (rawResponse === null) {
      // Heuristic fallback
      const fallback = {
        explanation: explanation || `Jawaban benar adalah "${correct_answer}". ${topic ? `Ini berkaitan dengan konsep ${topic}.` : ''}`,
        analogy: 'Coba bayangkan komputer seperti sebuah restoran: CPU adalah koki utama yang memproses semua pesanan.',
        reflection_question: `Mengapa ${topic || 'konsep ini'} penting dalam desain sistem komputer modern?`,
        study_recommendation: topic || 'CPU Architecture',
        encouragement: 'Terus semangat! Setiap kesalahan adalah kesempatan belajar.'
      };
      return res.json({ data: fallback, model: 'heuristic', theta, generated_at: new Date().toISOString() });
    }

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    res.json({ data: parsed, model: 'gemini', theta, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[AI] Personalized tutor error:', err.message);
    res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
});

// ─── FLASHCARD GENERATOR ─────────────────────────────────────────────────
// Generate study flashcards from topic + student level
router.post('/generate-flashcards', authenticateToken, aiLimiter, async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic wajib diisi.' });

    const safeCount = Math.min(Math.max(parseInt(count) || 5, 3), 10);
    const studentId = req.user.id;

    let theta = 0;
    try {
      const tr = await pool.query('SELECT theta FROM users WHERE id = $1', [studentId]);
      theta = tr.rows[0]?.theta || 0;
    } catch { /* default */ }

    const level = theta < 0 ? 'dasar' : theta < 1 ? 'menengah' : 'lanjutan';

    const prompt = `Generate ${safeCount} flashcard studi Arsitektur Komputer untuk topik: "${topic}" dengan level: ${level}.

Format JSON murni tanpa markdown:
{
  "flashcards": [
    { "front": "pertanyaan atau konsep", "back": "jawaban atau penjelasan singkat (max 2 kalimat)", "difficulty": 1 },
    ...
  ]
}

difficulty: 1=mudah, 2=sedang, 3=sulit. Sesuaikan dengan level ${level}.`;

    const rawResponse = await callGemini(prompt);

    if (rawResponse === null) {
      return res.json({
        data: { flashcards: [
          { front: `Apa fungsi utama ${topic}?`, back: `${topic} berfungsi sebagai komponen inti dalam arsitektur komputer modern.`, difficulty: 1 },
          { front: `Sebutkan karakteristik ${topic}!`, back: 'Karakteristik utama mencakup kecepatan, kapasitas, dan efisiensi energi.', difficulty: 2 }
        ]},
        model: 'heuristic', topic, generated_at: new Date().toISOString()
      });
    }

    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json({ data: JSON.parse(cleanJson), model: 'gemini', topic, theta, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('[AI] Flashcard gen error:', err.message);
    res.status(503).json(AI_UNAVAILABLE_RESPONSE);
  }
});

module.exports = router;
