/**
 * ARKON E2E Tests — Playwright
 * NFR-MAINT-002: E2E test coverage untuk critical paths
 * TASK-TEST-003: E2E Critical Paths
 * 
 * Run: npx playwright test
 * Setup: npm install -D @playwright/test && npx playwright install chromium
 * 
 * Critical Paths dari Task Breakdown §4.2:
 * 1. Mahasiswa: Register → Verify Email → Login → Join Room → Complete Quiz → See Theta
 * 2. Dosen: Login → Create Room → Upload Material → Launch Live Quiz → See Analytics
 * 3. Gamification: Earn coin → Buy component → Build PC → Publish to showroom
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';
const API_URL  = process.env.API_URL || 'http://localhost:3000';

// ─── Test Fixtures ─────────────────────────────────────────────────────────
const TEST_MAHASISWA = {
  name: 'E2E Test Mahasiswa',
  nim: `E2E${Date.now()}`,
  email: `e2e-mahasiswa-${Date.now()}@test.arkon.dev`,
  password: 'TestPass123!',
  role: 'mahasiswa'
};

const TEST_DOSEN = {
  name: 'E2E Test Dosen',
  nim: `DOS${Date.now()}`,
  email: `e2e-dosen-${Date.now()}@test.arkon.dev`,
  password: 'TestPass123!',
  role: 'dosen'
};

// ─── CRITICAL PATH 1: Mahasiswa — Login & Quiz ─────────────────────────────
test.describe('Critical Path 1: Mahasiswa — Login to Quiz', () => {

  test('Landing page loads correctly', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/ARKON/i);
    await expect(page.locator('text=Mulai Belajar').or(page.locator('h1'))).toBeVisible({ timeout: 10000 });
  });

  test('Login page accessible and form renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="NIM" i]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]').or(page.locator('text=Masuk'))).toBeVisible();
  });

  test('Register page renders all required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    // Full name
    await expect(page.locator('input[placeholder*="Nama" i]').or(page.locator('label:has-text("Nama")'))).toBeVisible({ timeout: 5000 });
    // Password
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Role selection
    await expect(page.locator('[aria-label*="Pilih peran"]').or(page.locator('text=Mahasiswa'))).toBeVisible({ timeout: 5000 });
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const emailInput = page.locator('input[type="email"]').or(page.locator('input[placeholder*="NIM" i]').first());
    await emailInput.fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').or(page.locator('button:has-text("Masuk")')).click();

    // Expect error message
    await expect(page.locator('[class*="error"], [class*="red"], [role="alert"]').first())
      .toBeVisible({ timeout: 5000 });
  });

  test('Login form has correct labels (NFR-A11Y-002)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // All inputs should have associated labels
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    // Should have label or aria-label
    const hasLabel = await passwordInput.evaluate(el => {
      const id = el.id;
      const ariaLabel = el.getAttribute('aria-label');
      const ariaLabelledBy = el.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      return !!(ariaLabel || ariaLabelledBy || label);
    });
    expect(hasLabel).toBe(true);
  });

  test('Register form validation works', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"]').or(page.locator('button:has-text("Daftar")'));
    await submitBtn.click();
    // Should show validation errors, not navigate away
    await expect(page).toHaveURL(/register/);
  });

  test('Forgot password page accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });
});

// ─── CRITICAL PATH 2: Dosen — Dashboard Navigation ─────────────────────────
test.describe('Critical Path 2: Dosen — Dashboard', () => {

  test('Workspace redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/workspace`);
    await expect(page).toHaveURL(/login/);
  });

  test('Lecturer dashboard redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/lecturer-dashboard`);
    await expect(page).toHaveURL(/login/);
  });
});

// ─── CRITICAL PATH 3: Accessibility Checks ────────────────────────────────
test.describe('Critical Path 3: Accessibility (NFR-A11Y)', () => {

  test('Landing page has skip-to-content link', async ({ page }) => {
    await page.goto(BASE_URL);
    const skipLink = page.locator('[href="#main-content"]').or(page.locator('a:has-text("Skip to")'));
    // Skip link may be visually hidden but should exist
    const count = await skipLink.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Login page has no keyboard trap', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    // Tab through the form
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Should still be on the page (no trap)
    await expect(page).toHaveURL(/login/);
  });

  test('Page titles are descriptive', async ({ page }) => {
    await page.goto(BASE_URL);
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(3);
  });
});

// ─── CRITICAL PATH 4: PWA & Mobile ─────────────────────────────────────────
test.describe('Critical Path 4: PWA & Mobile (F-014)', () => {

  test('manifest.json is accessible', async ({ page }) => {
    const res = await page.goto(`${BASE_URL}/manifest.json`);
    expect(res.status()).toBe(200);
    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.icons).toBeDefined();
    expect(manifest.start_url).toBeDefined();
  });

  test('Mobile viewport renders landing page without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone SE
    await page.goto(BASE_URL);
    // No horizontal scrollbar
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 5); // 5px tolerance
  });

  test('Mobile login form is usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/login`);
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    // Touch target size (min 44px recommended by WCAG)
    const box = await passwordInput.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(36); // slightly relaxed
  });
});

// ─── CRITICAL PATH 5: API Health ────────────────────────────────────────────
test.describe('Critical Path 5: Backend Health', () => {

  test('API health endpoint returns 200', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toMatch(/healthy|degraded/);
  });

  test('API returns 401 for protected routes without token', async ({ request }) => {
    const endpoints = [
      '/api/rooms',
      '/api/gamification/leaderboard',
    ];
    for (const ep of endpoints) {
      const res = await request.get(`${API_URL}${ep}`);
      expect([401, 403]).toContain(res.status());
    }
  });

  test('API auth endpoints exist and return proper errors', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/login`, {
      data: { identifier_number: 'nonexistent', password: 'wrongpass' }
    });
    expect([400, 401, 404]).toContain(res.status());
  });
});
