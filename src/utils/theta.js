/**
 * ARKON Theta Utilities — TASK-FEAT-002
 * 
 * Maps raw IRT theta values to human-readable ability levels.
 * Used across QuizGame, QuizLevelMap, and ThetaProgressCard.
 * 
 * Theta scale: approximately -4 to +4 (logit scale)
 * Mapping based on educational assessment literature.
 */

/**
 * Ability level definitions with theta ranges and display properties
 */
export const ABILITY_LEVELS = [
  { id: 'pemula',      name: 'Pemula',      emoji: '🌱', min: -Infinity, max: -2.0, color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  { id: 'dasar',       name: 'Dasar',       emoji: '📘', min: -2.0,      max: -1.0, color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
  { id: 'berkembang',  name: 'Berkembang',   emoji: '📈', min: -1.0,      max: 0.0,  color: '#eab308', bgColor: 'rgba(234, 179, 8, 0.15)' },
  { id: 'kompeten',    name: 'Kompeten',     emoji: '⭐', min: 0.0,       max: 1.0,  color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  { id: 'mahir',       name: 'Mahir',        emoji: '🏆', min: 1.0,       max: 2.0,  color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  { id: 'master',      name: 'Master',       emoji: '👑', min: 2.0,       max: Infinity, color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)' },
];

/**
 * Get the ability level object for a given theta value
 * @param {number} theta - IRT theta estimate
 * @returns {Object} Ability level definition
 */
export function getAbilityLevel(theta) {
  const t = typeof theta === 'number' ? theta : 0;
  for (const level of ABILITY_LEVELS) {
    if (t >= level.min && t < level.max) return level;
  }
  return ABILITY_LEVELS[ABILITY_LEVELS.length - 1]; // fallback to Master
}

/**
 * Get progress percentage within current level (0-100)
 * @param {number} theta - IRT theta estimate
 * @returns {number} Progress percentage within current level
 */
export function getLevelProgress(theta) {
  const t = typeof theta === 'number' ? theta : 0;
  const level = getAbilityLevel(t);
  
  // Handle edge levels
  const effectiveMin = Math.max(level.min, -4);
  const effectiveMax = Math.min(level.max, 4);
  const range = effectiveMax - effectiveMin;
  
  if (range <= 0) return 100;
  return Math.min(100, Math.max(0, ((t - effectiveMin) / range) * 100));
}

/**
 * Calculate percentile rank within a class
 * @param {number} theta - Student's theta
 * @param {number[]} classThetas - Array of all theta values in class
 * @returns {number} Percentile rank (0-100)
 */
export function getPercentileRank(theta, classThetas) {
  if (!Array.isArray(classThetas) || classThetas.length === 0) return 50;
  const t = typeof theta === 'number' ? theta : 0;
  const below = classThetas.filter(ct => ct < t).length;
  return Math.round((below / classThetas.length) * 100);
}

/**
 * Get overall progress across all levels (0-100)
 * Maps theta from range [-4, 4] to [0, 100]
 * @param {number} theta
 * @returns {number}
 */
export function getOverallProgress(theta) {
  const t = typeof theta === 'number' ? theta : 0;
  const clamped = Math.max(-4, Math.min(4, t));
  return Math.round(((clamped + 4) / 8) * 100);
}

/**
 * Get a motivational message based on theta change
 * @param {number} oldTheta
 * @param {number} newTheta
 * @returns {string}
 */
export function getThetaChangeMessage(oldTheta, newTheta) {
  const diff = newTheta - oldTheta;
  if (diff > 0.5) return 'Luar biasa! Kemampuanmu meningkat signifikan! 🚀';
  if (diff > 0.2) return 'Bagus! Kamu membuat kemajuan yang baik! 📈';
  if (diff > 0) return 'Kamu terus berkembang. Pertahankan! 💪';
  if (diff > -0.2) return 'Tetap semangat, terus berlatih! 🎯';
  return 'Jangan menyerah! Setiap latihan membantumu maju. 💡';
}
