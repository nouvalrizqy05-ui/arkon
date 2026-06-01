/**
 * ARKON N-Gain Service — Normalized Gain Calculation
 * 
 * N-Gain = (PostTest - PreTest) / (MaxScore - PreTest)
 * 
 * Interpretasi (Hake, 1999):
 * - g >= 0.7  → Tinggi (High)
 * - 0.3 <= g < 0.7 → Sedang (Medium)
 * - g < 0.3  → Rendah (Low)
 * 
 * Digunakan untuk mengukur efektivitas pembelajaran per mahasiswa
 * dalam konteks room-based activities.
 */

/**
 * Hitung N-Gain individual
 * @param {number} preScore - Skor pre-test (0-100)
 * @param {number} postScore - Skor post-test (0-100)
 * @param {number} maxScore - Skor maksimum (default 100)
 * @returns {{ gain: number, category: string, label: string, color: string }}
 */
function calculateNGain(preScore, postScore, maxScore = 100) {
  // Edge case: pre-test sudah sempurna
  if (preScore >= maxScore) {
    return { gain: 0, category: 'ceiling', label: 'Ceiling Effect', color: '#6366f1' };
  }

  const gain = (postScore - preScore) / (maxScore - preScore);
  
  // Clamp to [-1, 1] range
  const clampedGain = Math.max(-1, Math.min(1, gain));

  return {
    gain: parseFloat(clampedGain.toFixed(3)),
    ...categorizeNGain(clampedGain)
  };
}

/**
 * Kategorisasi N-Gain berdasarkan Hake (1999)
 */
function categorizeNGain(gain) {
  if (gain >= 0.7) return { category: 'high', label: 'Tinggi', color: '#10b981' };
  if (gain >= 0.3) return { category: 'medium', label: 'Sedang', color: '#f59e0b' };
  if (gain >= 0)   return { category: 'low', label: 'Rendah', color: '#ef4444' };
  return { category: 'negative', label: 'Penurunan', color: '#dc2626' };
}

/**
 * Hitung N-Gain batch untuk seluruh kelas
 * @param {Array<{student_id: string, student_name: string, pre_score: number, post_score: number}>} data
 * @returns {{ students: Array, classAverage: object, distribution: object }}
 */
function calculateClassNGain(data) {
  const results = data.map(d => ({
    student_id: d.student_id,
    student_name: d.student_name,
    pre_score: d.pre_score,
    post_score: d.post_score,
    ...calculateNGain(d.pre_score, d.post_score)
  }));

  // Class average
  const validGains = results.filter(r => r.category !== 'ceiling').map(r => r.gain);
  const avgGain = validGains.length > 0
    ? validGains.reduce((sum, g) => sum + g, 0) / validGains.length
    : 0;

  // Distribution
  const distribution = {
    high: results.filter(r => r.category === 'high').length,
    medium: results.filter(r => r.category === 'medium').length,
    low: results.filter(r => r.category === 'low').length,
    negative: results.filter(r => r.category === 'negative').length,
    ceiling: results.filter(r => r.category === 'ceiling').length,
  };

  return {
    students: results,
    classAverage: {
      gain: parseFloat(avgGain.toFixed(3)),
      ...categorizeNGain(avgGain),
      totalStudents: data.length,
    },
    distribution
  };
}

/**
 * Hitung efektivitas pembelajaran berdasarkan N-Gain kelas
 * (Untuk laporan dosen)
 */
function getLearningEffectiveness(classAvgGain) {
  if (classAvgGain >= 0.7) return { level: 'Sangat Efektif', recommendation: 'Metode pembelajaran sangat berhasil. Pertahankan dan kembangkan.' };
  if (classAvgGain >= 0.3) return { level: 'Cukup Efektif', recommendation: 'Perlu penguatan pada area yang lemah. Coba variasi aktivitas.' };
  if (classAvgGain >= 0) return { level: 'Kurang Efektif', recommendation: 'Evaluasi ulang metode. Pertimbangkan pendekatan yang lebih interaktif.' };
  return { level: 'Tidak Efektif', recommendation: 'Metode pembelajaran perlu diubah total. Identifikasi kesulitan spesifik mahasiswa.' };
}

module.exports = {
  calculateNGain,
  categorizeNGain,
  calculateClassNGain,
  getLearningEffectiveness
};
