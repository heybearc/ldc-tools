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

test('sign-in emails a reset link, and announcements take a web link instead of roles', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByText('We email a one-time link.')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toHaveCount(0);
  await page.fill('input[name="email"]', 'release-gate-nobody@example.com');
  await page.getByRole('button', { name: 'Email reset link' }).click();
  await expect(page.getByText('If an account exists for that email, a reset link is on its way.')).toBeVisible();

  await page.getByRole('button', { name: 'Back to sign in' }).click();
  await signIn(page);

  await page.goto('/admin/announcements');
  await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New Announcement' }).click();
  await expect(page.getByRole('heading', { name: 'New Announcement' })).toBeVisible();
  await expect(page.getByLabel('Web link (optional)')).toBeVisible();
  await expect(page.getByText('Target Roles')).toHaveCount(0);
  await expect(page.getByRole('option', { name: 'Global (whole app)' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'New Announcement' })).toHaveCount(0);
});
