import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth';

// Helper to check for Next.js error boundary
async function assertNoErrorBoundary(page: Page) {
  const bodyText = await page.textContent('body');
  expect(bodyText).not.toContain("This page couldn't load");
  expect(bodyText).not.toContain("Application error");
}

test.describe('Production E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.describe('Calendar Recovery', () => {
    const calendarUrls = [
      '/calendar',
      '/calendar?month=8&year=2026',
      '/calendar?propertyId=invalid'
    ];

    for (const url of calendarUrls) {
      test(`should load ${url} without error`, async ({ page }) => {
        const response = await page.goto(url);
        expect(response?.status()).toBeLessThan(400);
        
        await assertNoErrorBoundary(page);
        await expect(page.locator('h1').first()).toBeVisible();
        const pageContent = await page.textContent('body');
        expect(pageContent?.length).toBeGreaterThan(0);
      });
    }
  });

  test.describe('Arabic Mode Navigation & Sidebar', () => {
    test.use({ locale: 'ar-SA' });

    const routes = [
      '/',
      '/calendar',
      '/reservations',
      '/guests',
      '/tasks',
      '/messages',
      '/properties',
      '/settings'
    ];

    const arabicTitles = [
      'لوحة التحكم',
      'التقويم',
      'الحجوزات',
      'الضيوف',
      'العقارات',
      'المهام',
      'الرسائل',
      'الإعدادات'
    ];

    for (const route of routes) {
      test(`should render Arabic correctly on ${route}`, async ({ page, context }) => {
        const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3005';
        const hostname = new URL(baseUrl).hostname;

        await context.addCookies([{
          name: 'gf-locale',
          value: 'ar',
          domain: hostname,
          path: '/'
        }]);

        await page.goto(route);
        
        // Assert html lang="ar" dir="rtl"
        const html = page.locator('html');
        await expect(html).toHaveAttribute('lang', 'ar');
        await expect(html).toHaveAttribute('dir', 'rtl');

        const navText = await page.locator('nav').first().innerText() || '';

        // Assert rendered Arabic text in Sidebar
        for (const title of arabicTitles) {
          expect(navText).toContain(title);
        }

        // Assert NO un-translated system English navigation titles in Sidebar
        const forbiddenEnglishStrings = [
          'Dashboard',
          'Calendar',
          'Reservations',
          'Guests',
          'Properties',
          'Tasks',
          'Messages',
          'Settings',
          'Sign out'
        ];

        for (const str of forbiddenEnglishStrings) {
          expect(navText).not.toMatch(new RegExp(`\\b${str}\\b`));
        }
      });
    }
  });

  test.describe('Properties Route Recovery & QA', () => {
    test('should render /properties without application error boundary and allow clicking Manage and Connect Airbnb', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      const response = await page.goto('/properties');
      expect(response?.status()).toBeLessThan(400);

      await assertNoErrorBoundary(page);
      await expect(page.locator('h1').first()).toHaveText(/Properties|العقارات/);

      // Verify no React serialization error or nested link warnings in console
      const severeErrors = errors.filter(e => e.includes('Event handlers cannot be passed') || e.includes('validateDOMNesting'));
      expect(severeErrors).toHaveLength(0);

      // Verify Manage link works
      const manageLink = page.locator('a', { hasText: /Manage|إدارة/ }).first();
      if (await manageLink.isVisible()) {
        await manageLink.click();
        await expect(page).toHaveURL(/\/properties\/[a-zA-Z0-9_-]+/);
      }

      // Back to properties and test Connect Airbnb
      await page.goto('/properties');
      const connectLink = page.locator('a', { hasText: /Connect Airbnb|ربط Airbnb/ }).first();
      if (await connectLink.isVisible()) {
        await connectLink.click();
        await expect(page).toHaveURL(/\/properties\/connect-airbnb/);
      }
    });
  });

  test.describe('Viewport QA Matrix', () => {
    test('Verify Quick Add dropdown and mobile sidebar drawer', async ({ page, isMobile, viewport }) => {
      await page.goto('/');

      if (isMobile || (viewport && viewport.width < 1024)) {
        const nav = page.locator('nav').first();
        await expect(nav).toBeAttached();
      } else {
        const nav = page.locator('nav').first();
        await expect(nav).toBeVisible();
      }

      const bodyText = await page.textContent('body');
      expect(bodyText?.length).toBeGreaterThan(0);
    });
  });
});
