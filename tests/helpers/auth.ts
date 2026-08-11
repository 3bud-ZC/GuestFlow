import { Page } from '@playwright/test';

export type E2ERole = 'admin' | 'reception';

export function getE2ECredentials(role: E2ERole = 'admin') {
  const emailVar = role === 'admin' ? 'E2E_ADMIN_EMAIL' : 'E2E_RECEPTION_EMAIL';
  const passwordVar = role === 'admin' ? 'E2E_ADMIN_PASSWORD' : 'E2E_RECEPTION_PASSWORD';
  const email = process.env[emailVar];
  const password = process.env[passwordVar];

  if (!email || !password) {
    throw new Error(
      `Missing required E2E credentials: ${emailVar} and/or ${passwordVar} are not set. ` +
        'Set these environment variables before running the E2E suite. No default credentials are provided.'
    );
  }

  return { email, password };
}

export async function login(page: Page, role: E2ERole = 'admin') {
  const { email, password } = getE2ECredentials(role);

  await page.goto('/login');
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/', { timeout: 15000 });
}
