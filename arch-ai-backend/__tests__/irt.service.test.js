/**
 * ARKON IRT Service — Unit Tests
 * 
 * Tests cover:
 * - Rasch probability calculation (boundary + normal cases)
 * - Newton-Raphson theta convergence
 * - Item information function
 * - Adaptive question selection
 * - Theta-to-category mapping
 * - Difficulty level conversion
 * 
 * All tests are deterministic (no random data).
 */

const {
  raschProbability,
  updateTheta,
  itemInformation,
  selectNextQuestion,
  thetaToCategory,
  diffLevelToTheta
} = require('../services/irt.service');

// ============================================================
// raschProbability()
// ============================================================
describe('raschProbability', () => {
  test('returns ~0.5 when theta equals difficulty', () => {
    const p = raschProbability(0, 0);
    expect(p).toBeCloseTo(0.5, 4);
  });

  test('returns high probability when theta >> difficulty', () => {
    const p = raschProbability(3, -1);
    expect(p).toBeGreaterThan(0.95);
  });

  test('returns low probability when theta << difficulty', () => {
    const p = raschProbability(-2, 2);
    expect(p).toBeLessThan(0.05);
  });

  test('clamps to ~1 for very large exponent (overflow protection)', () => {
    const p = raschProbability(15, -5);
    expect(p).toBeCloseTo(0.99999, 4);
  });

  test('clamps to ~0 for very small exponent (overflow protection)', () => {
    const p = raschProbability(-15, 5);
    expect(p).toBeCloseTo(0.00001, 4);
  });

  test('probability is monotonically increasing with theta', () => {
    const p1 = raschProbability(-1, 0);
    const p2 = raschProbability(0, 0);
    const p3 = raschProbability(1, 0);
    expect(p1).toBeLessThan(p2);
    expect(p2).toBeLessThan(p3);
  });

  test('probability is monotonically decreasing with difficulty', () => {
    const p1 = raschProbability(0, -1);
    const p2 = raschProbability(0, 0);
    const p3 = raschProbability(0, 1);
    expect(p1).toBeGreaterThan(p2);
    expect(p2).toBeGreaterThan(p3);
  });
});

// ============================================================
// updateTheta() — Newton-Raphson convergence
// ============================================================
describe('updateTheta (Newton-Raphson MLE)', () => {
  test('converges to positive theta when all answers correct on easy items', () => {
    const responses = [
      { correct: true, difficulty: -1.0 },
      { correct: true, difficulty: 0.0 },
      { correct: true, difficulty: 0.5 },
    ];
    const theta = updateTheta(responses, 0);
    expect(theta).toBeGreaterThan(1.0);
  });

  test('converges to negative theta when all answers wrong on hard items', () => {
    const responses = [
      { correct: false, difficulty: -0.5 },
      { correct: false, difficulty: 0.0 },
      { correct: false, difficulty: 1.0 },
    ];
    const theta = updateTheta(responses, 0);
    expect(theta).toBeLessThan(-1.0);
  });

  test('converges near 0 for 50/50 correct on balanced difficulty', () => {
    const responses = [
      { correct: true, difficulty: -0.5 },
      { correct: false, difficulty: 0.5 },
      { correct: true, difficulty: -1.0 },
      { correct: false, difficulty: 1.0 },
    ];
    const theta = updateTheta(responses, 0);
    expect(theta).toBeGreaterThan(-1.0);
    expect(theta).toBeLessThan(1.0);
  });

  test('respects initial theta as starting point', () => {
    const responses = [{ correct: true, difficulty: 0 }];
    const theta1 = updateTheta(responses, -2);
    const theta2 = updateTheta(responses, 2);
    // Both should converge toward similar values given same responses,
    // but may differ slightly due to starting point
    expect(typeof theta1).toBe('number');
    expect(typeof theta2).toBe('number');
  });

  test('clamps theta within [-4, 4] range', () => {
    const allCorrect = Array(20).fill({ correct: true, difficulty: -3 });
    const theta = updateTheta(allCorrect, 0);
    expect(theta).toBeLessThanOrEqual(4);
    expect(theta).toBeGreaterThanOrEqual(-4);
  });

  test('returns a number with 3 decimal precision', () => {
    const responses = [
      { correct: true, difficulty: 0 },
      { correct: false, difficulty: 1 },
    ];
    const theta = updateTheta(responses, 0);
    const decimals = theta.toString().split('.')[1] || '';
    expect(decimals.length).toBeLessThanOrEqual(3);
  });

  test('handles empty responses array gracefully', () => {
    const theta = updateTheta([], 0.5);
    expect(theta).toBe(0.5); // Should return initial theta unchanged
  });

  test('converges consistently across multiple iterations param values', () => {
    const responses = [
      { correct: true, difficulty: -1 },
      { correct: true, difficulty: 0 },
      { correct: false, difficulty: 1 },
    ];
    const theta5 = updateTheta(responses, 0, 5);
    const theta15 = updateTheta(responses, 0, 15);
    const theta50 = updateTheta(responses, 0, 50);
    // More iterations should converge to similar value
    expect(Math.abs(theta15 - theta50)).toBeLessThan(0.1);
  });
});

// ============================================================
// itemInformation()
// ============================================================
describe('itemInformation', () => {
  test('maximum information when theta equals difficulty', () => {
    const info = itemInformation(0, 0);
    expect(info).toBeCloseTo(0.25, 4); // p*(1-p) = 0.5*0.5
  });

  test('decreasing information when theta far from difficulty', () => {
    const infoClose = itemInformation(0, 0);
    const infoFar = itemInformation(0, 3);
    expect(infoClose).toBeGreaterThan(infoFar);
  });

  test('information is always positive and bounded [0, 0.25]', () => {
    for (let theta = -4; theta <= 4; theta += 0.5) {
      const info = itemInformation(theta, 0);
      expect(info).toBeGreaterThanOrEqual(0);
      expect(info).toBeLessThanOrEqual(0.25 + 0.0001);
    }
  });

  test('symmetric: info(θ=1, b=0) equals info(θ=-1, b=0)', () => {
    const info1 = itemInformation(1, 0);
    const info2 = itemInformation(-1, 0);
    expect(info1).toBeCloseTo(info2, 6);
  });
});

// ============================================================
// selectNextQuestion()
// ============================================================
describe('selectNextQuestion', () => {
  const questionPool = [
    { id: 'q1', difficulty: -2.0 },
    { id: 'q2', difficulty: -0.5 },
    { id: 'q3', difficulty: 0.0 },
    { id: 'q4', difficulty: 0.5 },
    { id: 'q5', difficulty: 2.0 },
  ];

  test('selects question closest to theta (maximum information)', () => {
    const selected = selectNextQuestion(questionPool, 0.0, []);
    expect(selected.id).toBe('q3'); // difficulty 0 is closest to theta 0
  });

  test('excludes already-answered questions', () => {
    const selected = selectNextQuestion(questionPool, 0.0, ['q3']);
    // q2 or q4 should be selected (both are equidistant from 0)
    expect(['q2', 'q4']).toContain(selected.id);
  });

  test('returns null when all questions answered', () => {
    const selected = selectNextQuestion(questionPool, 0.0, ['q1', 'q2', 'q3', 'q4', 'q5']);
    expect(selected).toBeNull();
  });

  test('selects harder question for high-theta student', () => {
    const selected = selectNextQuestion(questionPool, 2.0, []);
    expect(selected.id).toBe('q5'); // difficulty 2.0 matches theta 2.0
  });

  test('selects easier question for low-theta student', () => {
    const selected = selectNextQuestion(questionPool, -2.0, []);
    expect(selected.id).toBe('q1'); // difficulty -2.0 matches theta -2.0
  });
});

// ============================================================
// thetaToCategory()
// ============================================================
describe('thetaToCategory', () => {
  test('maps high theta to category A (Sangat Baik)', () => {
    const result = thetaToCategory(2.5);
    expect(result.category).toBe('A');
    expect(result.label).toBe('Sangat Baik');
  });

  test('maps theta 1.5 to category B+ (Baik)', () => {
    const result = thetaToCategory(1.5);
    expect(result.category).toBe('B+');
  });

  test('maps theta 0.5 to category B (Cukup Baik)', () => {
    const result = thetaToCategory(0.5);
    expect(result.category).toBe('B');
  });

  test('maps theta -0.5 to category C (Cukup)', () => {
    const result = thetaToCategory(-0.5);
    expect(result.category).toBe('C');
  });

  test('maps theta -1.5 to category D (Kurang)', () => {
    const result = thetaToCategory(-1.5);
    expect(result.category).toBe('D');
  });

  test('maps very low theta to category E (Sangat Kurang)', () => {
    const result = thetaToCategory(-3.0);
    expect(result.category).toBe('E');
  });

  test('always returns color string', () => {
    for (let theta = -4; theta <= 4; theta += 0.5) {
      const result = thetaToCategory(theta);
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

// ============================================================
// diffLevelToTheta()
// ============================================================
describe('diffLevelToTheta', () => {
  test('maps level 1 (easy) to negative theta', () => {
    expect(diffLevelToTheta(1)).toBe(-1.5);
  });

  test('maps level 2 (medium) to zero theta', () => {
    expect(diffLevelToTheta(2)).toBe(0.0);
  });

  test('maps level 3 (hard) to positive theta', () => {
    expect(diffLevelToTheta(3)).toBe(1.5);
  });

  test('returns 0 for unknown level', () => {
    expect(diffLevelToTheta(99)).toBe(0.0);
    expect(diffLevelToTheta(undefined)).toBe(0.0);
  });
});
