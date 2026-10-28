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

test('home is the trade leadership directory and retired routes leave the old product', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Trade leadership' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Directory' }).first()).toBeVisible();

  await page.goto('/projects');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Trade leadership' })).toBeVisible();

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

test('a trade team opens into its crews and the edit form can place a photo', async ({ page }) => {
  await signIn(page);
  await page.goto('/trade-teams/overview');
  await expect(page.getByRole('heading', { name: 'Trade Teams Overview' })).toBeVisible();

  await page.getByRole('link', { name: 'Open team' }).first().click();
  await expect(page.getByRole('heading', { name: 'Crews' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add person' }).first()).toBeVisible();

  await page.goto('/trade-teams/overview');
  await page.locator('img.h-7.rounded-full').first().click();
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible();
  await expect(page.getByText('Drag so the face sits in the circle. Save crops it there.')).toBeVisible();
  await expect(page.getByText('Zoom', { exact: true })).toBeVisible();
  await expect(page.getByText('Replace photo')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeHidden();
});
