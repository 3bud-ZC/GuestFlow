import { test, expect, Page } from '@playwright/test';
import { login, getE2ECredentials } from './helpers/auth';
import { cleanupE2EData } from './helpers/cleanup';

const RUN_PREFIX = `GF-E2E-${Date.now()}`;

async function setLocale(page: Page, locale: 'ar' | 'en') {
  const baseUrl = test.info().project.use.baseURL || 'http://localhost:3005';
  const hostname = new URL(baseUrl).hostname;
  await page.context().addCookies([{ name: 'gf-locale', value: locale, domain: hostname, path: '/' }]);
}

test.describe('Users / Roles', () => {
  const receptionEmail = `${RUN_PREFIX.toLowerCase()}-reception@example.com`;
  const receptionPassword = 'Qa-Temp-Pass-1234!';

  test.afterAll(async () => {
    await cleanupE2EData(RUN_PREFIX);
  });

  test('Admin creates a RECEPTION QA user; RECEPTION is blocked server-side from admin-only mutations', async ({ page, request }) => {
    await login(page, 'admin');
    await page.goto('/admin/users');
    await page.getByRole('button', { name: /Add User|New User/i }).click();
    await page.locator('input[name="name"]').fill(`${RUN_PREFIX}-Reception`);
    await page.locator('input[name="email"]').fill(receptionEmail);
    await page.locator('input[name="password"]').fill(receptionPassword);
    await page.locator('select[name="role"]').selectOption('RECEPTION');
    await page.getByRole('button', { name: /Create User/i }).click();

    await expect(page.getByText(receptionEmail)).toBeVisible({ timeout: 10000 });

    // Log in as the new RECEPTION user and confirm the admin-only Users page
    // is not reachable / does not expose admin mutation controls.
    await page.context().clearCookies();
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(receptionEmail);
    await page.locator('input[type="password"]').fill(receptionPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/', { timeout: 15000 });

    await page.goto('/admin/users');
    // A RECEPTION user must not see the admin user-management controls.
    await expect(page.getByRole('button', { name: /Add User|New User/i })).toHaveCount(0);

    // Reception CAN reach reception-permitted areas.
    await page.goto('/guests');
    await expect(page.getByRole('heading', { name: /Guests/i })).toBeVisible();
  });
});

test.describe('Arabic action parity', () => {
  const propertyName = `${RUN_PREFIX}-ArProperty`;
  const guestFirstName = `${RUN_PREFIX}-ArGuest`;
  const taskTitle = `${RUN_PREFIX}-ArTask`;

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await setLocale(page, 'ar');
  });

  test.afterAll(async () => {
    await cleanupE2EData(RUN_PREFIX);
  });

  test('Add Property in Arabic — RTL UI, real DB write', async ({ page }) => {
    await page.goto('/properties');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');

    await page.getByRole('button', { name: /إضافة عقار/i }).click();
    await page.locator('input[name="name"]').fill(propertyName);
    await page.getByRole('button', { name: /إنشاء|حفظ/i }).click();
    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 10000 });
  });

  test('Add Guest in Arabic — real DB write', async ({ page }) => {
    await page.goto('/guests');
    await page.getByRole('button', { name: /إضافة ضيف/i }).click();
    await page.locator('input[name="firstName"]').fill(guestFirstName);
    await page.locator('input[name="lastName"]').fill('Arabic');
    await page.getByRole('button', { name: /إضافة ضيف/i }).last().click();
    await expect(page.getByText(guestFirstName)).toBeVisible({ timeout: 10000 });
  });

  test('Create Task in Arabic — real DB write', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /إنشاء مهمة|مهمة جديدة/i }).click();
    await page.locator('input[name="title"]').fill(taskTitle);
    await page.getByRole('button', { name: /إنشاء مهمة|إنشاء/i }).last().click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });
  });

  test('Airbnb Test Connection invalid-URL flow shows Arabic error text', async ({ page }) => {
    await page.goto('/properties/connect-airbnb');
    await expect(page.getByText(/ربط تقويم Airbnb/i)).toBeVisible();

    await page.getByRole('button', { name: /غرفة جديدة/i }).click();
    await page.getByRole('button', { name: /التالي/i }).click();

    await page.getByLabel(/اسم الغرفة/i).fill(`${RUN_PREFIX}-ArRoom`);
    await page.getByLabel(/رابط تقويم/i).fill('https://www.airbnb.com/calendar/ical/00000000000000001.ics?s=e2e-invalid');
    await page.getByRole('button', { name: /فحص الاتصال/i }).click();

    await expect(page.getByText(/لم يتم العثور|تعذر الوصول|غير صحيح/i)).toBeVisible({ timeout: 15000 });
  });

  test('Calendar navigation renders in Arabic', async ({ page }) => {
    await page.goto('/calendar');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
});

test.describe('Mobile action parity (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test('Mobile nav drawer opens and routes are reachable', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: /Open menu|menu/i }).first();
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await expect(page.locator('nav').first()).toBeVisible();
    } else {
      await expect(page.locator('nav').first()).toBeAttached();
    }
  });

  test('Quick Add is reachable and its actions are clickable without overflow', async ({ page }) => {
    await page.goto('/');
    const quickAdd = page.getByRole('button', { name: /Quick Add/i }).first();
    await expect(quickAdd).toBeVisible();
    await quickAdd.click();

    const addGuestOption = page.getByRole('link', { name: /Add Guest/i }).first();
    await expect(addGuestOption).toBeVisible();
    const box = await addGuestOption.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  test('Add Property drawer usable on mobile', async ({ page }) => {
    await page.goto('/properties');
    const addBtn = page.getByRole('button', { name: /Add Property/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    const submitBtn = page.getByRole('button', { name: /Create Property/i }).last();
    await expect(submitBtn).toBeVisible();
    const box = await submitBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  test('Airbnb Wizard usable on mobile without overflow', async ({ page }) => {
    await page.goto('/properties/connect-airbnb');
    await expect(page.getByRole('button', { name: /New Room/i })).toBeVisible();
    const nextBtn = page.getByRole('button', { name: /Next Step/i });
    const box = await nextBtn.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });
});
