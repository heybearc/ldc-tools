import { test, expect, type Page } from '@playwright/test';
import { removeReleaseChecks, revealWork } from './cleanup-release-checks';

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

test('an administrator can edit a task and the due date is labeled', async ({ page }) => {
  await signIn(page);

  let probe = await page.request.get('/api/v1/work-items');
  if (probe.status() === 403) {
    const groups = await page.request.get('/api/v1/construction-groups');
    expect(groups.ok()).toBeTruthy();
    const body = await groups.json();
    const constructionGroups = body.constructionGroups || [];
    const group = constructionGroups.find((item: { code?: string }) => item.code?.includes('01.12')) || constructionGroups[0];
    expect(group?.id).toBeTruthy();
    const filtered = await page.request.post('/api/v1/user/set-cg-filter', {
      data: { constructionGroupId: group.id },
    });
    expect(filtered.ok()).toBeTruthy();
    probe = await page.request.get('/api/v1/work-items');
  }
  expect(probe.ok()).toBeTruthy();

  const stamp = Date.now();
  const originalTitle = `Release check edit ${stamp}`;
  const updatedTitle = `Release check edited ${stamp}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title: originalTitle,
      detail: 'Release check for editing a deadline.',
      timingKind: 'DEADLINE',
      dueOn: '2026-12-15',
      claimable: false,
    },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();
  expect(item.timingLabel).toBe('Due Dec 15, 2026');

  await revealWork(page, originalTitle);
  const row = page.locator('article').filter({ hasText: originalTitle });
  await expect(row.getByText('Due date: Dec 15, 2026')).toBeVisible();
  await row.getByRole('button', { name: 'Edit' }).click();

  const form = page.locator('#work-form');
  await expect(form.getByRole('heading', { name: 'Edit work' })).toBeVisible();
  await form.locator('input').first().fill(updatedTitle);
  await form.locator('input[type="date"]').fill('2026-12-20');
  await form.getByRole('button', { name: 'Save changes' }).click();

  await revealWork(page, updatedTitle);
  const updated = page.locator('article').filter({ hasText: updatedTitle });
  await expect(updated.getByRole('heading', { name: updatedTitle })).toBeVisible();
  await expect(updated.getByText('Due date: Dec 20, 2026')).toBeVisible();
  await expect(updated.getByText(originalTitle)).toHaveCount(0);

  const done = await page.request.patch(`/api/v1/work-items/${item.id}`, {
    data: { status: 'DONE' },
  });
  expect(done.ok()).toBeTruthy();
  await removeReleaseChecks(page);
});
