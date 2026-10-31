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

test('a phone shows the menu, and chat opens the list before a thread', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);

  await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeVisible();
  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Chats' })).toBeHidden();

  const team = page.getByRole('button', { name: /Team chat/ }).first();
  if (await team.count()) {
    await team.click();
    await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible();
  }
});

test('the store app can sign in and read assigned work and the directory', async ({ request }) => {
  const denied = await request.post('/api/v1/auth/mobile', {
    data: { email: 'nobody@example.com', password: 'wrong-password' },
  });
  expect(denied.status()).toBe(401);

  const signedIn = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signedIn.ok()).toBeTruthy();
  const session = await signedIn.json();
  expect(typeof session.token).toBe('string');
  expect(session.token.length).toBeGreaterThan(20);

  const home = await request.get('/api/v1/mobile/home', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(home.ok()).toBeTruthy();
  const payload = await home.json();
  expect(Array.isArray(payload.work)).toBe(true);
  expect(Array.isArray(payload.people)).toBe(true);
  expect(payload.user?.email).toBeTruthy();
});
