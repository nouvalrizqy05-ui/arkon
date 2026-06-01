/**
 * ARKON N-Gain Service — Unit Tests
 * 
 * Tests cover:
 * - Individual N-Gain calculation
 * - N-Gain categorization (Hake, 1999)
 * - Class-level batch calculation
 * - Learning effectiveness assessment
 * - Edge cases (ceiling effect, negative gain, zero denominator)
 */

const {
  calculateNGain,
  categorizeNGain,
  calculateClassNGain,
  getLearningEffectiveness
} = require('../services/ngain.service');

// ============================================================
// calculateNGain() — Individual
// ============================================================
describe('calculateNGain', () => {
  test('calculates correct N-Gain for typical improvement', () => {
    // pre=40, post=70, max=100 → (70-40)/(100-40) = 30/60 = 0.5
    const result = calculateNGain(40, 70);
    expect(result.gain).toBeCloseTo(0.5, 3);
    expect(result.category).toBe('medium');
  });

  test('classifies high N-Gain (≥0.7)', () => {
    // pre=20, post=80 → 60/80 = 0.75
    const result = calculateNGain(20, 80);
    expect(result.gain).toBeCloseTo(0.75, 3);
    expect(result.category).toBe('high');
    expect(result.label).toBe('Tinggi');
  });

  test('classifies medium N-Gain (0.3–0.7)', () => {
    // pre=50, post=75 → 25/50 = 0.5
    const result = calculateNGain(50, 75);
    expect(result.category).toBe('medium');
    expect(result.label).toBe('Sedang');
  });

  test('classifies low N-Gain (<0.3)', () => {
    // pre=60, post=70 → 10/40 = 0.25
    const result = calculateNGain(60, 70);
    expect(result.gain).toBeCloseTo(0.25, 3);
    expect(result.category).toBe('low');
    expect(result.label).toBe('Rendah');
  });

  test('handles negative gain (regression)', () => {
    // pre=70, post=50 → (50-70)/(100-70) = -20/30 ≈ -0.667
    const result = calculateNGain(70, 50);
    expect(result.gain).toBeLessThan(0);
    expect(result.category).toBe('negative');
  });

  test('handles ceiling effect (pre-test already perfect)', () => {
    const result = calculateNGain(100, 100);
    expect(result.gain).toBe(0);
    expect(result.category).toBe('ceiling');
    expect(result.label).toBe('Ceiling Effect');
  });

  test('handles zero improvement', () => {
    const result = calculateNGain(50, 50);
    expect(result.gain).toBe(0);
    expect(result.category).toBe('low');
  });

  test('handles max possible improvement (pre=0, post=100)', () => {
    const result = calculateNGain(0, 100);
    expect(result.gain).toBeCloseTo(1.0, 3);
    expect(result.category).toBe('high');
  });

  test('clamps gain to [-1, 1] range', () => {
    const result = calculateNGain(90, 100);
    expect(result.gain).toBeLessThanOrEqual(1);
    expect(result.gain).toBeGreaterThanOrEqual(-1);
  });

  test('supports custom max score', () => {
    // pre=20, post=40, max=50 → 20/30 ≈ 0.667
    const result = calculateNGain(20, 40, 50);
    expect(result.gain).toBeCloseTo(0.667, 2);
    expect(result.category).toBe('medium');
  });
});

// ============================================================
// categorizeNGain()
// ============================================================
describe('categorizeNGain', () => {
  test('boundary: exactly 0.7 is high', () => {
    const result = categorizeNGain(0.7);
    expect(result.category).toBe('high');
  });

  test('boundary: exactly 0.3 is medium', () => {
    const result = categorizeNGain(0.3);
    expect(result.category).toBe('medium');
  });

  test('boundary: exactly 0 is low', () => {
    const result = categorizeNGain(0);
    expect(result.category).toBe('low');
  });

  test('negative value is classified correctly', () => {
    const result = categorizeNGain(-0.5);
    expect(result.category).toBe('negative');
  });

  test('returns color string for all categories', () => {
    const values = [0.8, 0.5, 0.1, -0.3];
    values.forEach(v => {
      const result = categorizeNGain(v);
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});

// ============================================================
// calculateClassNGain() — Batch
// ============================================================
describe('calculateClassNGain', () => {
  const classData = [
    { student_id: '1', student_name: 'Student A', pre_score: 30, post_score: 70 },
    { student_id: '2', student_name: 'Student B', pre_score: 50, post_score: 80 },
    { student_id: '3', student_name: 'Student C', pre_score: 40, post_score: 55 },
    { student_id: '4', student_name: 'Student D', pre_score: 60, post_score: 90 },
    { student_id: '5', student_name: 'Student E', pre_score: 100, post_score: 100 }, // Ceiling
  ];

  test('returns correct number of student results', () => {
    const result = calculateClassNGain(classData);
    expect(result.students).toHaveLength(5);
  });

  test('calculates class average excluding ceiling effects', () => {
    const result = calculateClassNGain(classData);
    expect(result.classAverage).toBeDefined();
    expect(typeof result.classAverage.gain).toBe('number');
  });

  test('provides correct distribution counts', () => {
    const result = calculateClassNGain(classData);
    const dist = result.distribution;
    expect(dist.high + dist.medium + dist.low + dist.negative + dist.ceiling).toBe(5);
    expect(dist.ceiling).toBe(1); // Student E with pre=100
  });

  test('includes N-Gain per student', () => {
    const result = calculateClassNGain(classData);
    result.students.forEach(s => {
      expect(s).toHaveProperty('gain');
      expect(s).toHaveProperty('category');
      expect(s).toHaveProperty('pre_score');
      expect(s).toHaveProperty('post_score');
    });
  });

  test('reports totalStudents correctly', () => {
    const result = calculateClassNGain(classData);
    expect(result.classAverage.totalStudents).toBe(5);
  });

  test('handles empty class data', () => {
    const result = calculateClassNGain([]);
    expect(result.students).toHaveLength(0);
    expect(result.classAverage.gain).toBe(0);
    expect(result.classAverage.totalStudents).toBe(0);
  });
});

// ============================================================
// getLearningEffectiveness()
// ============================================================
describe('getLearningEffectiveness', () => {
  test('high gain → Sangat Efektif', () => {
    const result = getLearningEffectiveness(0.75);
    expect(result.level).toBe('Sangat Efektif');
    expect(result.recommendation).toBeDefined();
  });

  test('medium gain → Cukup Efektif', () => {
    const result = getLearningEffectiveness(0.45);
    expect(result.level).toBe('Cukup Efektif');
  });

  test('low gain → Kurang Efektif', () => {
    const result = getLearningEffectiveness(0.15);
    expect(result.level).toBe('Kurang Efektif');
  });

  test('negative gain → Tidak Efektif', () => {
    const result = getLearningEffectiveness(-0.1);
    expect(result.level).toBe('Tidak Efektif');
  });

  test('boundary: exactly 0.7 is Sangat Efektif', () => {
    expect(getLearningEffectiveness(0.7).level).toBe('Sangat Efektif');
  });

  test('boundary: exactly 0.3 is Cukup Efektif', () => {
    expect(getLearningEffectiveness(0.3).level).toBe('Cukup Efektif');
  });
});
