import { test, expect } from '@playwright/test';

test('rejected sign-in stays on the sign-in page', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', 'nobody@example.com');
  await page.fill('input[name="password"]', 'not-the-password');
  await page.click('button[type="submit"]');
  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/signin/);
});
