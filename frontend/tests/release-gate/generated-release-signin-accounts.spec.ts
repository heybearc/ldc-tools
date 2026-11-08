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

test('branded sign-in, account list, project save confirmation, and chat read state', async ({ page }) => {
  await page.goto('/auth/signin');
  await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
  await expect(page.getByText('LDC Tools', { exact: true })).toBeVisible();
  await expect(page.getByText('Work, projects, directory, and chat for your construction group.')).toBeVisible();
  await expect(page.locator('img[src="/logo.svg"]')).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await expect(page.getByText(/server/i)).toHaveCount(0);

  await signIn(page);

  await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible();
  await expect(page.getByText('Directory contacts stay in the directory.')).toBeVisible();

  const summary = await page.request.get('/api/v1/projects/summary');
  expect(summary.ok()).toBeTruthy();
  const list = await summary.json();
  const project = list.projects?.[0];
  if (list.canEdit && project) {
    await page.goto('/projects');
    const editor = page.locator('article').filter({ hasText: project.name });
    await editor.getByRole('button', { name: 'Edit project' }).click();
    await editor.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByText(`${project.name} saved. Status is`)).toBeVisible();
  }

  await page.goto('/chat');
  await expect(page.getByRole('heading', { name: 'Chat', exact: true })).toBeVisible();
  const markUnread = page.getByRole('button', { name: 'Mark unread' });
  if (await markUnread.count()) {
    await markUnread.first().click();
    const markRead = page.getByRole('button', { name: 'Mark read' });
    if (await markRead.count()) {
      await markRead.first().click();
      await expect(page.getByRole('button', { name: 'Mark unread' }).first()).toBeVisible();
    }
  }
});
