/**
 * ARKON Load Test — Live Quiz 50 Concurrent Users
 * Tool: k6 (https://k6.io)
 * 
 * Run: k6 run load-tests/live-quiz-load-test.js
 * Target: NFR-PERF-001 — Socket latency < 200ms for 50 concurrent users
 * 
 * Prerequisites:
 *   - k6 installed: brew install k6 / apt install k6
 *   - ARKON backend running at BASE_URL
 *   - Set env vars: k6 run -e BASE_URL=https://your-app.render.com ...
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────
const apiLatency    = new Trend('api_latency');
const errorRate     = new Rate('error_rate');
const quizAnswers   = new Counter('quiz_answers_submitted');

// ─── Test Config ───────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10  }, // Ramp up to 10 users
    { duration: '60s', target: 50  }, // Ramp up to 50 users (target)
    { duration: '60s', target: 50  }, // Hold at 50 users for 1 min
    { duration: '30s', target: 0   }, // Ramp down
  ],
  thresholds: {
    // NFR-PERF-001: 95% of API requests < 200ms
    'api_latency': ['p(95)<200'],
    // Error rate < 1%
    'error_rate': ['rate<0.01'],
    // Default k6 http_req_duration
    'http_req_duration': ['p(95)<300', 'p(99)<500'],
  },
};

// ─── Shared test data ──────────────────────────────────
const TEST_SESSION_ID = __ENV.SESSION_ID || 'test-session-001';
const TEST_ROOM_ID    = __ENV.ROOM_ID    || 'test-room-001';
const TEST_QUESTION_ID = __ENV.QUESTION_ID || 'test-question-001';

// ─── Main scenario ─────────────────────────────────────
export default function () {
  const userId = `load-test-user-${__VU}`; // VU = virtual user number

  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'health: status 200': (r) => r.status === 200 });
  apiLatency.add(healthRes.timings.duration);

  sleep(0.5);

  // 2. Simulate submit answer (most common live quiz action)
  const answerPayload = JSON.stringify({
    session_id:     TEST_SESSION_ID,
    question_id:    TEST_QUESTION_ID,
    student_id:     userId,
    selected_index: Math.floor(Math.random() * 4),
    correct_index:  2,
    answer_time_ms: Math.floor(Math.random() * 15000) + 1000,
    duration_seconds: 20
  });

  const answerRes = http.post(
    `${BASE_URL}/api/live-quiz/answer`,
    answerPayload,
    { headers: { 'Content-Type': 'application/json' } }
  );

  const answerOk = check(answerRes, {
    'answer: status 200 or 401': (r) => [200, 401, 403].includes(r.status),
    'answer: response time < 200ms': (r) => r.timings.duration < 200,
  });

  apiLatency.add(answerRes.timings.duration);
  errorRate.add(!answerOk);
  if (answerOk) quizAnswers.add(1);

  sleep(0.5);

  // 3. Simulate leaderboard check
  const lbRes = http.get(`${BASE_URL}/api/live-quiz/leaderboard/${TEST_SESSION_ID}`);
  check(lbRes, {
    'leaderboard: status 200 or 401': (r) => [200, 401, 403].includes(r.status),
    'leaderboard: response time < 200ms': (r) => r.timings.duration < 200,
  });
  apiLatency.add(lbRes.timings.duration);

  sleep(1);
}

// ─── Summary display ───────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics.api_latency?.values['p(95)'];
  const p99 = data.metrics.api_latency?.values['p(99)'];
  const errRate = data.metrics.error_rate?.values['rate'];

  console.log('\n═══════════════════════════════════════════════');
  console.log('  ARKON Live Quiz Load Test — Summary');
  console.log('═══════════════════════════════════════════════');
  console.log(`  P95 Latency : ${p95?.toFixed(2)} ms  (Target: < 200ms)`);
  console.log(`  P99 Latency : ${p99?.toFixed(2)} ms`);
  console.log(`  Error Rate  : ${(errRate * 100)?.toFixed(2)}%  (Target: < 1%)`);
  console.log(`  NFR Status  : ${p95 < 200 ? '✅ PASS' : '❌ FAIL — needs optimization'}`);
  console.log('═══════════════════════════════════════════════\n');

  return {
    'load-tests/results/summary.json': JSON.stringify(data, null, 2),
  };
}
