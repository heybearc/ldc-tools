import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

test('the volunteer roster route returns to the directory home', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15000 });

  await page.goto('/volunteers');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Trade leadership' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Volunteers', exact: true })).toHaveCount(0);
});
