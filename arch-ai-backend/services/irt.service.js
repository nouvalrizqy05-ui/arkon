/**
 * ARKON IRT Service — Implementasi Rasch Model (1PL)
 * 
 * Model Rasch adalah bentuk paling sederhana dari Item Response Theory (IRT).
 * P(correct) = exp(theta - b) / (1 + exp(theta - b))
 * 
 * theta: kemampuan mahasiswa (ability parameter)
 * b: kesulitan soal (difficulty parameter)
 * 
 * Referensi: Rasch, G. (1960). Probabilistic models for some intelligence and attainment tests.
 */

/**
 * Menghitung probabilitas jawaban benar menggunakan Rasch Model
 * @param {number} theta - Kemampuan mahasiswa [-4, 4]
 * @param {number} difficulty - Tingkat kesulitan soal [-4, 4]
 * @returns {number} Probabilitas jawaban benar [0, 1]
 */
function raschProbability(theta, difficulty) {
  const exponent = theta - difficulty;
  // Clamp untuk menghindari overflow
  if (exponent > 10) return 0.99999;
  if (exponent < -10) return 0.00001;
  const exp = Math.exp(exponent);
  return exp / (1 + exp);
}

/**
 * Update theta (kemampuan) mahasiswa menggunakan Newton-Raphson MLE
 * @param {Array<{correct: boolean, difficulty: number}>} responses - Array respons mahasiswa
 * @param {number} currentTheta - Theta saat ini
 * @param {number} iterations - Jumlah iterasi Newton-Raphson (default: 15)
 * @returns {number} Theta baru yang diestimasi
 */
function updateTheta(responses, currentTheta = 0, iterations = 15) {
  let theta = currentTheta;

  for (let i = 0; i < iterations; i++) {
    let firstDeriv = 0;
    let secondDeriv = 0;

    responses.forEach(({ correct, difficulty }) => {
      const p = raschProbability(theta, difficulty);
      const response = correct ? 1 : 0;
      firstDeriv += response - p;           // L'(theta)
      secondDeriv -= p * (1 - p);           // L''(theta)
    });

    if (Math.abs(secondDeriv) < 0.0001) break; // Konvergensi tercapai
    
    const delta = firstDeriv / secondDeriv;
    theta = theta - delta;
    
    // Clamp theta ke range yang wajar [-4, 4]
    theta = Math.max(-4, Math.min(4, theta));
    
    // Konvergensi check
    if (Math.abs(delta) < 0.001) break;
  }

  return parseFloat(theta.toFixed(3));
}

/**
 * Menghitung Information Function — mengukur seberapa informatif suatu soal
 * untuk mengukur kemampuan mahasiswa pada level theta tertentu.
 * Maximum information tercapai ketika theta ≈ difficulty.
 * @param {number} theta - Kemampuan mahasiswa
 * @param {number} difficulty - Kesulitan soal
 * @returns {number} Nilai informasi
 */
function itemInformation(theta, difficulty) {
  const p = raschProbability(theta, difficulty);
  return p * (1 - p);
}

/**
 * Pilih soal berikutnya secara adaptif berdasarkan Maximum Information
 * Soal yang paling informatif adalah yang difficulty-nya paling dekat dengan theta.
 * @param {Array<{id: string, difficulty: number}>} questions - Pool soal yang tersedia
 * @param {number} currentTheta - Theta saat ini
 * @param {Array<string>} answeredIds - ID soal yang sudah dijawab
 * @returns {object|null} Soal terbaik berikutnya
 */
function selectNextQuestion(questions, currentTheta, answeredIds = []) {
  const unanswered = questions.filter(q => !answeredIds.includes(q.id));
  if (unanswered.length === 0) return null;

  // Maximum Information Selection
  return unanswered.reduce((best, q) => {
    const infoCurrent = itemInformation(currentTheta, q.difficulty);
    const infoBest = itemInformation(currentTheta, best.difficulty);
    return infoCurrent > infoBest ? q : best;
  }, unanswered[0]);
}

/**
 * Konversi theta ke kategori performa yang mudah dipahami dosen
 * @param {number} theta - Nilai theta mahasiswa
 * @returns {{category: string, label: string, color: string}}
 */
function thetaToCategory(theta) {
  if (theta >= 2.0) return { category: 'A', label: 'Sangat Baik', color: '#10b981' };
  if (theta >= 1.0) return { category: 'B+', label: 'Baik', color: '#22c55e' };
  if (theta >= 0.0) return { category: 'B', label: 'Cukup Baik', color: '#eab308' };
  if (theta >= -1.0) return { category: 'C', label: 'Cukup', color: '#f97316' };
  if (theta >= -2.0) return { category: 'D', label: 'Kurang', color: '#ef4444' };
  return { category: 'E', label: 'Sangat Kurang', color: '#dc2626' };
}

/**
 * Map difficulty level (1-3) dari quiz generator ke theta scale
 * @param {number} diffLevel - Level kesulitan dari AI (1=easy, 2=medium, 3=hard)
 * @returns {number} Difficulty dalam skala theta
 */
function diffLevelToTheta(diffLevel) {
  const mapping = { 1: -1.5, 2: 0.0, 3: 1.5 };
  return mapping[diffLevel] || 0.0;
}

module.exports = {
  raschProbability,
  updateTheta,
  itemInformation,
  selectNextQuestion,
  thetaToCategory,
  diffLevelToTheta
};
