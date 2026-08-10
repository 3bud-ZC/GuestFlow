import { test, expect } from '@playwright/test';

test.describe('Functional E2E Tests - Full Workflows', () => {
  // Use sequential mode to avoid conflicts with shared state if any
  test.describe.configure({ mode: 'serial' });

  let propertyId: string;
  const timestamp = Date.now();
  const propertyName = `GF-E2E-${timestamp}-Property`;
  const roomName = `GF-E2E-${timestamp}-Room`;

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('admin@guestflow.app');
      await passwordInput.fill('password');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/');
    }
  });

  test('Create Property, Room, and Connect Airbnb (Invalid URL flow)', async ({ page }) => {
    // 1. Navigate to Properties
    await page.goto('/properties');
    await expect(page.locator('h1').first()).toHaveText(/Properties|العقارات/);

    // 2. Open Add Property dialog and create
    // We assume there's a button to add property.
    // However, if we don't know the exact selector, we can look for "Add Property" or "إضافة عقار"
    const addPropertyBtn = page.getByRole('button', { name: /Add Property|إضافة عقار/i }).first();
    if (await addPropertyBtn.isVisible()) {
        await addPropertyBtn.click();
        
        // Fill form
        await page.getByLabel(/Name|الاسم/i).fill(propertyName);
        await page.getByRole('button', { name: /Save|حفظ/i }).click();

        // Wait for creation and navigate
        await expect(page.getByText(propertyName)).toBeVisible();
    }
    
    // We will navigate to the wizard to test the connection logic
    await page.goto('/properties/connect-airbnb');
    await expect(page.getByText(/Connect Airbnb Calendar/i)).toBeVisible();

    // Select "New Room" mode
    await page.getByRole('button', { name: /New Room|غرفة جديدة/i }).click();
    await page.getByRole('button', { name: /Next|التالي/i }).click();

    // The property selector should be visible. We might not be able to easily select it if it's auto-selected,
    // but let's fill the room name and a fake URL to test the validation error handling.
    await page.getByLabel(/Room Name|اسم الغرفة/i).fill(roomName);
    
    const fakeUrl = 'https://www.airbnb.com/calendar/ical/99999999.ics?s=FAKE';
    await page.getByLabel(/Airbnb Calendar URL|رابط تقويم/i).fill(fakeUrl);
    
    // Click Test Connection
    await page.getByRole('button', { name: /Test Connection|فحص الاتصال/i }).click();

    // Since 99999999.ics is a fake listing that returns 404, we expect our new structured error:
    // "not found" or "لم يتم العثور"
    await expect(page.getByText(/not found|لم يتم العثور/i)).toBeVisible({ timeout: 10000 });
  });
});
