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

test('the mobile install page stays behind sign-in', async ({ page }) => {
  await page.goto('/mobile');
  await expect(page).toHaveURL(/\/auth\/signin\?callbackUrl=%2Fmobile/);
});

test('a signed-in user can open both store install links', async ({ page }) => {
  await signIn(page);
  await page.goto('/mobile');
  await expect(page.getByRole('heading', { name: 'Mobile app' })).toBeVisible();
  const appStore = page.getByRole('link', { name: 'Download on the App Store' });
  const play = page.getByRole('link', { name: 'Get it on Google Play' });
  await expect(appStore.first()).toHaveAttribute('href', 'https://testflight.apple.com/join/U1qScvxu');
  await expect(play.first()).toHaveAttribute('href', 'https://play.google.com/apps/test/com.ldctools.mobile/23');
  await expect(appStore).toHaveCount(2);
  await expect(play).toHaveCount(2);
});
