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

test('directory edit keeps an ended person until a replacement starts', async ({ page }) => {
  await signIn(page);
  await page.goto('/trade-teams/overview');
  await expect(page.getByRole('heading', { name: 'Trade Teams Overview' })).toBeVisible();
  await expect(page.getByPlaceholder('Search trade, person, or role')).toBeVisible();

  await page.getByRole('button', { name: 'Add person' }).click();
  await expect(page.getByRole('heading', { name: 'Add person' })).toBeVisible();
  await expect(page.getByText('An end date deactivates this person.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Add person' })).toBeHidden();

  await page.locator('img.h-7.rounded-full').first().click();
  await expect(page.getByRole('heading', { name: 'Edit entry' })).toBeVisible();
  await expect(page.getByLabel('End date')).toBeVisible();
  await expect(page.getByText('until someone else in the same role is added with a start date')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('heading', { name: 'Trade Teams Overview' })).toBeVisible();
});
