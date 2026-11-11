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

test('creating an account uses platform access and rejects an organizational role', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/users');

  await page.getByRole('button', { name: 'Create User' }).click();
  const dialog = page.locator('.fixed').filter({
    has: page.getByRole('heading', { name: 'Create User', exact: true }),
  });
  const role = dialog.locator('select');
  await expect(role.locator('option')).toHaveText([
    'Select access',
    'User',
    'Admin',
    'Super Admin',
    'Read Only',
  ]);
  await expect(dialog.getByText('Zone Overseer')).toHaveCount(0);

  const rejected = await page.request.post('/api/v1/admin/users', {
    data: {
      name: 'Release Check',
      email: `release-role-${Date.now()}@example.com`,
      password: 'ChangeMe!1',
      role: 'ZONE_OVERSEER',
    },
  });
  expect(rejected.status()).toBe(400);

  const email = `release-user-${Date.now()}@example.com`;
  const created = await page.request.post('/api/v1/admin/users', {
    data: {
      name: 'Release Check',
      email,
      password: 'ChangeMe!1',
      role: 'USER',
    },
  });
  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(body.user.role).toBe('USER');
  expect(body.user.email).toBe(email);

  const removed = await page.request.delete(`/api/v1/admin/users/${body.user.id}`);
  expect(removed.ok()).toBeTruthy();
});
