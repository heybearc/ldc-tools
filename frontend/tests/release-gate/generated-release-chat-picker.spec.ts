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

test('a new chat starts from search or the person list', async ({ page }) => {
  await signIn(page);
  const chat = await page.request.get('/api/v1/chat');
  expect(chat.ok()).toBeTruthy();
  const body = await chat.json();
  const teammates: Array<{ name: string | null; email: string }> = body.teammates || [];
  expect(teammates.length).toBeGreaterThan(0);
  const titles = new Set((body.channels || []).map((channel: { title?: string }) => channel.title || ''));
  const person = teammates.find((candidate) => candidate.email && !titles.has(candidate.email)) || teammates[0];
  const name = person.name || person.email;
  const searchNeedle = person.email || name;

  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New chat' })).toBeVisible();
  await expect(page.getByLabel('Search conversations')).toBeVisible();
  await expect(page.getByLabel('Choose a person')).toHaveCount(0);
  await expect(page.getByLabel('Search people')).toHaveCount(0);
  await expect(page.locator('button').filter({ has: page.getByText('Team chat', { exact: true }) }).first()).toBeVisible();

  await page.getByRole('button', { name: 'New chat' }).click();
  await expect(page.getByLabel('Search people')).toBeVisible();
  const picker = page.getByLabel('Choose a person');
  await expect(picker).toBeVisible();
  await expect(picker.locator('option')).toHaveCount(teammates.length + 1);
  await expect(picker.locator('option', { hasText: name })).toHaveCount(1);
  await expect(page.getByRole('button', { name: searchNeedle })).toHaveCount(0);

  await page.getByLabel('Search people').fill(searchNeedle);
  await expect(page.getByRole('button', { name: searchNeedle })).toBeVisible();
});
