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

  const team = page.locator('button').filter({ has: page.getByText('Team', { exact: true }) }).first();
  await expect(team).toBeVisible();
  await team.click();
  await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible();
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
  expect(Array.isArray(payload.available)).toBe(true);
  expect(Array.isArray(payload.people)).toBe(true);
  expect(Array.isArray(payload.directory?.constructionGroup)).toBe(true);
  expect(Array.isArray(payload.directory?.personnel)).toBe(true);
  expect(Array.isArray(payload.directory?.ancillary)).toBe(true);
  expect(Array.isArray(payload.directory?.teams)).toBe(true);
  expect(payload.user?.email).toBeTruthy();

  const missing = await request.get('/api/v1/mobile/projects');
  expect(missing.status()).toBe(401);

  const projects = await request.get('/api/v1/mobile/projects', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(projects.ok()).toBeTruthy();
  const list = await projects.json();
  expect(Array.isArray(list.projects)).toBe(true);
  if (list.projects.length > 0) {
    expect(list.projects[0].name).toBeTruthy();
    expect(typeof list.projects[0].status).toBe('string');
    expect(Array.isArray(list.projects[0].personnel)).toBe(true);
    expect(Array.isArray(list.projects[0].schedule)).toBe(true);
  }
});
