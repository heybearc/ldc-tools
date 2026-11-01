import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

async function signIn(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15000 });
}

test('work explains an expired session and a failed load', async ({ page }) => {
  await signIn(page);

  await page.route('**/api/v1/work-items', (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });
  await page.goto('/work');
  await expect(page.getByText('Sign in again. This session is no longer valid.')).toBeVisible();

  await page.unroute('**/api/v1/work-items');
  await page.route('**/api/v1/work-items', (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    return route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Failed to load work' }),
    });
  });
  await page.reload();
  await expect(page.getByText('Could not load work. Try again in a moment.')).toBeVisible();
});
