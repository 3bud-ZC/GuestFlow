import { test, expect } from '@playwright/test';
import { getE2ECredentials } from './helpers/auth';

interface PerformanceMetric {
  route: string;
  clickToVisibleMs: number;
  clickToSettledMs: number;
  requestCount: number;
  rscDurationMs: number;
  fullReload: boolean;
}

test.describe('Real Production Navigation Performance Pass', () => {
  test.use({ actionTimeout: 15000 });

  test('Benchmark route transition performance across warm authenticated session', async ({ page }) => {
    const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'https://guestflow.abud.fun';
    const { email, password } = getE2ECredentials('admin');

    // 1. Authenticate session
    await page.goto(`${baseUrl}/login`);
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(`${baseUrl}/`);

    // Warm up session
    await page.goto(`${baseUrl}/`);
    await page.waitForLoadState('networkidle');

    const routeSequence = [
      { name: 'Dashboard -> Calendar', linkText: 'Calendar', expectedUrl: '/calendar' },
      { name: 'Calendar -> Reservations', linkText: 'Reservations', expectedUrl: '/reservations' },
      { name: 'Reservations -> Guests', linkText: 'Guests', expectedUrl: '/guests' },
      { name: 'Guests -> Properties', linkText: 'Properties', expectedUrl: '/properties' },
      { name: 'Properties -> Tasks', linkText: 'Tasks', expectedUrl: '/tasks' },
      { name: 'Tasks -> Messages', linkText: 'Messages', expectedUrl: '/messages' },
      { name: 'Messages -> Settings', linkText: 'Settings', expectedUrl: '/settings' },
      { name: 'Settings -> Dashboard', linkText: 'Dashboard', expectedUrl: '/' },
    ];

    const iterations = 5;
    const allMetrics: Record<string, PerformanceMetric[]> = {};

    for (let i = 0; i < iterations; i++) {
      // Ensure starting on Dashboard
      if (page.url() !== `${baseUrl}/`) {
        await page.goto(`${baseUrl}/`);
        await page.waitForLoadState('networkidle');
      }

      for (const step of routeSequence) {
        if (!allMetrics[step.name]) allMetrics[step.name] = [];

        let requestCount = 0;
        let rscDurationMs = 0;
        let hardReloadOccurred = false;

        const requestHandler = (request: any) => {
          requestCount++;
          const url = request.url();
          if (url.includes('_rsc=') || request.headers()['rsc'] === '1') {
            const start = Date.now();
            request.response().then((res: any) => {
              if (res) rscDurationMs = Math.max(rscDurationMs, Date.now() - start);
            }).catch(() => {});
          }
        };

        const navHandler = () => {
          hardReloadOccurred = true;
        };

        page.on('request', requestHandler);
        page.on('framenavigated', navHandler);

        const clickStart = Date.now();
        
        // Find sidebar or header link
        const targetLink = page.locator('nav a, header a').filter({ hasText: new RegExp(`^${step.linkText}$`, 'i') }).first();
        await targetLink.click();

        await page.waitForURL(`**${step.expectedUrl}`);
        const visibleMs = Date.now() - clickStart;

        await page.waitForLoadState('networkidle');
        const settledMs = Date.now() - clickStart;

        page.off('request', requestHandler);
        page.off('framenavigated', navHandler);

        allMetrics[step.name].push({
          route: step.name,
          clickToVisibleMs: visibleMs,
          clickToSettledMs: settledMs,
          requestCount,
          rscDurationMs,
          fullReload: hardReloadOccurred,
        });
      }
    }

    console.log('\n=== REAL NAVIGATION BENCHMARK RESULTS ===');
    for (const [stepName, metrics] of Object.entries(allMetrics)) {
      const visibles = metrics.map(m => m.clickToVisibleMs).sort((a, b) => a - b);
      const settleds = metrics.map(m => m.clickToSettledMs).sort((a, b) => a - b);
      const medianVisible = visibles[Math.floor(visibles.length / 2)];
      const p95Visible = visibles[Math.floor(visibles.length * 0.95)];
      const medianSettled = settleds[Math.floor(settleds.length / 2)];
      const p95Settled = settleds[Math.floor(settleds.length * 0.95)];

      console.log(`${stepName}:`);
      console.log(`  Visible: median=${medianVisible}ms, p95=${p95Visible}ms`);
      console.log(`  Settled: median=${medianSettled}ms, p95=${p95Settled}ms`);
      console.log(`  Requests: avg=${(metrics.reduce((acc, m) => acc + m.requestCount, 0) / metrics.length).toFixed(1)}`);
      
      expect(p95Visible).toBeLessThan(5000); // Safe threshold for E2E CI
    }
  });
});
