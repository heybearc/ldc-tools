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

test('chat notifications start off and the team list stays up until a thread is opened', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.goto('/chat');

  await expect(page.getByRole('heading', { name: 'Chat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn on notifications' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Turn off' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Chats' })).toBeHidden();

  const team = page.locator('button').filter({ has: page.getByText('Team', { exact: true }) }).first();
  await expect(team).toBeVisible();
  await team.click();
  await expect(page.getByRole('button', { name: 'Chats' })).toBeVisible();
  await expect(page.getByText('Notifications are on for this browser.')).toBeHidden();
});
