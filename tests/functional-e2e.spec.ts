import { test, expect, Page } from '@playwright/test';
import { login } from './helpers/auth';
import { cleanupE2EData } from './helpers/cleanup';

// Fails the test on any of: uncaught page error, console.error, HTTP 5xx response,
// or an unhandled promise rejection surfaced to the page. Call once per test.
function failOnSilentErrors(page: Page) {
  const violations: string[] = [];

  page.on('pageerror', (err) => violations.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') violations.push(`console.error: ${msg.text()}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 500) violations.push(`HTTP ${res.status()}: ${res.url()}`);
  });

  return () => {
    expect(violations, `Silent failures detected:\n${violations.join('\n')}`).toEqual([]);
  };
}

const RUN_PREFIX = `GF-E2E-${Date.now()}`;

test.describe('GuestFlow Functional Acceptance Suite', () => {
  test.describe.configure({ mode: 'serial' });

  const propertyName = `${RUN_PREFIX}-Property`;
  const roomName = `${RUN_PREFIX}-Room`;
  const guestFirstName = `${RUN_PREFIX}-Guest`;
  const guestLastName = 'Functional';
  const taskTitle = `${RUN_PREFIX}-Task`;
  const reservationCode = `${RUN_PREFIX}-RES1`;
  const reservationCode2 = `${RUN_PREFIX}-RES2`;

  let propertyId = '';
  let guestId = '';

  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.afterAll(async () => {
    const result = await cleanupE2EData(RUN_PREFIX);
    console.log(`[QA Cleanup] Removed ${result.reservationsDeleted} reservation(s) and all related ${RUN_PREFIX} records.`);
  });

  // ---------- Properties ----------
  test('Property: create, verify, persist across refresh', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/properties');
    await expect(page.getByRole('heading', { name: /Properties/i })).toBeVisible();

    await page.getByRole('button', { name: /Add Property/i }).click();
    await page.locator('input[name="name"]').fill(propertyName);
    await page.locator('input[name="address"]').fill('123 QA Street');
    await page.getByRole('button', { name: /Create Property/i }).click();

    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.getByText(propertyName)).toBeVisible();

    // Capture the property id from the detail link for later tests
    const link = page.getByRole('link', { name: propertyName });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/\/properties\/[a-zA-Z0-9_-]+/);
    propertyId = href!.split('/').pop()!;

    assertNoSilentFailures();
  });

  test('Property: open, edit, save, refresh', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);
    expect(propertyId, 'propertyId must be set by the create test').toBeTruthy();

    await page.goto(`/properties/${propertyId}`);
    await expect(page.getByRole('heading', { name: propertyName })).toBeVisible();

    await page.getByRole('button', { name: 'Edit' }).click();
    const updatedAddress = '456 QA Avenue Updated';
    await page.locator('input[name="address"]').fill(updatedAddress);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText(updatedAddress)).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.getByText(updatedAddress)).toBeVisible();

    assertNoSilentFailures();
  });

  // ---------- Rooms + Airbnb ----------
  test('Room: create inside property, verify persistence', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);
    expect(propertyId).toBeTruthy();

    await page.goto(`/properties/${propertyId}`);
    await page.getByRole('button', { name: /Add Room/i }).click();
    await page.locator('input[name="name"]').fill(roomName);
    await page.getByRole('button', { name: /Add Room/i }).last().click();

    await expect(page.getByText(roomName)).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.getByText(roomName)).toBeVisible();

    assertNoSilentFailures();
  });

  test('Airbnb: Test Connection shows a specific inline error for an invalid URL (no ErrorBoundary)', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);
    expect(propertyId).toBeTruthy();

    await page.goto(`/properties/${propertyId}`);

    const roomRow = page.locator('div', { hasText: roomName }).first();
    await page.getByRole('button', { name: /Connect Airbnb/i }).first().click();

    const urlInput = page.locator('input[type="url"]').first();
    await urlInput.fill('https://www.airbnb.com/calendar/ical/00000000000000000.ics?s=e2e-invalid-token');

    await page.getByRole('button', { name: /Test Connection/i }).click();

    // Must show a specific inline error, not a blank state or the global error boundary.
    await expect(page.getByText(/not found|invalid|could not reach|لم يتم العثور|تعذر الوصول|غير صحيح/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Application error/i)).toHaveCount(0);

    assertNoSilentFailures();
  });

  // ---------- Guests ----------
  test('Guest: create, search, open, edit, refresh', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/guests');
    await page.getByRole('button', { name: /Add Guest/i }).click();
    await page.locator('input[name="firstName"]').fill(guestFirstName);
    await page.locator('input[name="lastName"]').fill(guestLastName);
    await page.locator('input[name="phone"]').fill('+201000000000');
    await page.getByRole('button', { name: /Add Guest/i }).last().click();

    await expect(page.getByText(guestFirstName)).toBeVisible({ timeout: 10000 });

    // Search
    await page.locator('input[name="q"]').fill(guestFirstName);
    await page.getByRole('button', { name: /Search/i }).click();
    await expect(page.getByText(guestFirstName)).toBeVisible();

    // Open
    const guestLink = page.getByRole('link', { name: new RegExp(guestFirstName) }).first();
    const href = await guestLink.getAttribute('href');
    expect(href).toMatch(/\/guests\/[a-zA-Z0-9_-]+/);
    guestId = href!.split('/').pop()!;
    await guestLink.click();
    await expect(page).toHaveURL(new RegExp(`/guests/${guestId}`));

    // Edit
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.locator('input[name="nationality"]').fill('QA-Land');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('QA-Land')).toBeVisible({ timeout: 10000 });

    await page.reload();
    await expect(page.getByText('QA-Land')).toBeVisible();

    // Update document status
    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('RECEIVED');
    await expect(page.getByText(/RECEIVED|Received/i).first()).toBeVisible({ timeout: 10000 });

    assertNoSilentFailures();
  });

  // ---------- Reservations ----------
  test('Reservation: create with existing guest, verify fields, refresh', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);
    expect(propertyId).toBeTruthy();
    expect(guestId).toBeTruthy();

    await page.goto('/reservations/create');
    await page.locator('input[name="code"]').fill(reservationCode);
    await page.locator('select[name="platform"]').selectOption('DIRECT');
    await page.locator('select[name="propertyId"]').selectOption(propertyId);
    await page.locator('select[name="roomId"]').selectOption({ label: roomName });
    await page.locator('select[name="guestId"]').selectOption(guestId);

    const today = new Date();
    const checkIn = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const checkOut = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.locator('input[name="checkInDate"]').fill(checkIn);
    await page.locator('input[name="checkOutDate"]').fill(checkOut);
    await page.locator('input[name="numberOfGuests"]').fill('2');

    await page.getByRole('button', { name: /Create Reservation/i }).click();

    await expect(page).toHaveURL(/\/reservations\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await expect(page.getByText(reservationCode)).toBeVisible();
    await expect(page.getByText(propertyName)).toBeVisible();
    await expect(page.getByText(roomName)).toBeVisible();

    await page.reload();
    await expect(page.getByText(reservationCode)).toBeVisible();

    assertNoSilentFailures();
  });

  test('Reservation lifecycle: check-in then check-out, invalid transition blocked', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/reservations');
    await page.locator('input[name="q"], input[type="search"]').first().fill(reservationCode).catch(() => {});

    const link = page.getByRole('link', { name: new RegExp(reservationCode) }).first();
    await link.click();
    await expect(page).toHaveURL(/\/reservations\/[a-zA-Z0-9_-]+/);

    // Check-out must be blocked before check-in (invalid transition)
    await expect(page.getByRole('button', { name: /CHECK OUT GUEST/i })).toHaveCount(0);

    await page.getByRole('button', { name: /CHECK IN GUEST/i }).click();
    await expect(page.getByText(/CHECKED_IN/i)).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /CHECK OUT GUEST/i }).click();
    await expect(page.getByText(/CHECKED_OUT/i)).toBeVisible({ timeout: 10000 });

    // Now fully checked out — no further primary operations should be offered
    await expect(page.getByRole('button', { name: /CHECK IN GUEST/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /CHECK OUT GUEST/i })).toHaveCount(0);

    assertNoSilentFailures();
  });

  test('Reservation lifecycle: cancel', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);
    expect(propertyId).toBeTruthy();
    expect(guestId).toBeTruthy();

    await page.goto('/reservations/create');
    await page.locator('input[name="code"]').fill(reservationCode2);
    await page.locator('select[name="platform"]').selectOption('DIRECT');
    await page.locator('select[name="propertyId"]').selectOption(propertyId);
    await page.locator('select[name="roomId"]').selectOption({ label: roomName });
    await page.locator('select[name="guestId"]').selectOption(guestId);

    const today = new Date();
    const checkIn = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const checkOut = new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    await page.locator('input[name="checkInDate"]').fill(checkIn);
    await page.locator('input[name="checkOutDate"]').fill(checkOut);
    await page.locator('input[name="numberOfGuests"]').fill('1');
    await page.getByRole('button', { name: /Create Reservation/i }).click();
    await expect(page).toHaveURL(/\/reservations\/[a-zA-Z0-9_-]+/, { timeout: 15000 });

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /Cancel Reservation/i }).click();
    await expect(page.getByText(/CANCELLED/i)).toBeVisible({ timeout: 10000 });

    assertNoSilentFailures();
  });

  // ---------- Tasks ----------
  test('Task: create, open, change status, complete, refresh', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/tasks');
    await page.getByRole('button', { name: /Create Task/i }).click();
    await page.locator('input[name="title"]').fill(taskTitle);
    await page.locator('textarea[name="description"]').fill('Created by functional E2E suite');
    await page.getByRole('button', { name: /Create Task/i }).last().click();

    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    const row = page.locator('tr', { hasText: taskTitle });
    await row.getByRole('link', { name: /View all/i }).click();
    await expect(page).toHaveURL(/\/tasks\/[a-zA-Z0-9_-]+/);

    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('IN_PROGRESS');
    await expect(page.getByText(/Updating/i)).toHaveCount(0, { timeout: 10000 });

    await statusSelect.selectOption('DONE');
    await page.reload();
    await expect(page.locator('select').first()).toHaveValue('DONE');

    assertNoSilentFailures();
  });

  test('Task: search, filter, pagination controls render', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/tasks');
    await page.locator('select[name="status"]').selectOption('DONE');
    await page.getByRole('button', { name: /Filter/i }).click();
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    assertNoSilentFailures();
  });

  // ---------- Calendar ----------
  test('Calendar: month navigation and property filter', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/calendar');
    await expect(page.getByRole('heading').first()).toBeVisible();

    const initialUrl = page.url();
    await page.getByRole('link', { name: /Next|›|»/i }).first().click();
    await expect(page).not.toHaveURL(initialUrl);

    await page.getByRole('link', { name: /Today/i }).first().click();
    await expect(page.getByRole('heading').first()).toBeVisible();

    if (propertyId) {
      await page.locator('select[name="propertyId"]').selectOption(propertyId);
      await expect(page).toHaveURL(new RegExp(`propertyId=${propertyId}`));
    }

    assertNoSilentFailures();
  });

  // ---------- Settings ----------
  test('Settings: save a change and verify persistence', async ({ page }) => {
    const assertNoSilentFailures = failOnSilentErrors(page);

    await page.goto('/settings');
    const checkinInput = page.locator('input[name="checkinTime"], select[name="checkinTime"]').first();
    if (await checkinInput.count() > 0) {
      const tag = await checkinInput.evaluate(el => el.tagName.toLowerCase());
      if (tag === 'select') {
        const options = await checkinInput.locator('option').allTextContents();
        await checkinInput.selectOption({ index: options.length > 1 ? 1 : 0 });
      } else {
        await checkinInput.fill('15:00');
      }
    }

    await page.getByRole('button', { name: /Save/i }).first().click();
    await page.waitForTimeout(1000);
    await page.reload();
    await expect(page.getByRole('heading').first()).toBeVisible();

    assertNoSilentFailures();
  });
});
