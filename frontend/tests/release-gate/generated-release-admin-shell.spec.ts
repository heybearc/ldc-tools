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

test('admin announcements keeps the actions column inside the window', async ({ page }) => {
  await signIn(page);
  await page.setViewportSize({ width: 1180, height: 800 });
  await page.goto('/admin/announcements');

  await expect(page.getByRole('heading', { name: 'Admin Control Center' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Announcements', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New Announcement' })).toBeVisible();

  const actions = page.getByRole('columnheader', { name: 'Actions' });
  await expect(actions).toBeVisible();
  const box = await actions.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1181);

  const pageScrollsSideways = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(pageScrollsSideways).toBe(false);
});
