import { test, expect, type Page } from '@playwright/test';

/**
 * Product smoke beyond the volunteer quick checks.
 * Directory, Work, Chat, Projects, and the store-app sign-in.
 */

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

test('directory, work, chat, and projects open after sign-in', async ({ page }) => {
  await signIn(page);

  await page.goto('/trade-teams/overview');
  await expect(page.getByRole('heading', { name: 'Directory' })).toBeVisible();
  await page.getByPlaceholder('Search trade, person, or role').fill('a');

  await page.goto('/work');
  await expect(page.getByRole('heading', { name: 'Work' })).toBeVisible();

  await page.goto('/my-work');
  await expect(page.getByRole('heading', { name: 'My Work' })).toBeVisible();

  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();

  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

  await page.goto('/processes');
  await expect(page.getByRole('heading', { name: 'Processes' })).toBeVisible();
});

test('the store app rejects a bad password and reads work and the directory', async ({ request }) => {
  const denied = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: 'wrong-password' },
  });
  expect(denied.status()).toBe(401);
  const deniedBody = await denied.json();
  expect(deniedBody.error).toBe('Email or password is incorrect');

  const signedIn = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signedIn.ok()).toBeTruthy();
  const session = await signedIn.json();

  const home = await request.get('/api/v1/mobile/home', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(home.ok()).toBeTruthy();
  const payload = await home.json();
  expect(Array.isArray(payload.work)).toBe(true);
  expect(Array.isArray(payload.available)).toBe(true);
  expect(Array.isArray(payload.people)).toBe(true);
  expect(Array.isArray(payload.directory?.teams)).toBe(true);
  expect(payload.user?.email).toBeTruthy();
});
