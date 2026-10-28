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

test('a sister can only be support and an entry can move trade or crew', async ({ page }) => {
  await signIn(page);
  await page.goto('/trade-teams/overview');
  await expect(page.getByRole('heading', { name: 'Directory' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeVisible();

  await page.locator('img.h-7.rounded-full').first().click();
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible();
  await expect(page.getByLabel('Trade').locator('option')).not.toHaveCount(0);
  await expect(page.getByLabel('Crew')).toBeVisible();

  await page.getByLabel('Sister').check();
  const options = page.getByLabel('Role').locator('option');
  await expect(options).toHaveCount(1);
  await expect(options).toHaveText(/Support/);

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeHidden();
});
