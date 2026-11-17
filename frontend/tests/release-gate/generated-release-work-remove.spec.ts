import { test, expect, type Page } from '@playwright/test';
import { removeReleaseChecks } from './cleanup-release-checks';

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

test('an administrator can remove a task', async ({ page }) => {
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
  }

  const title = `Release check remove ${Date.now()}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title,
      detail: 'Release check for removing a task.',
      timingKind: 'NONE',
      claimable: false,
    },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();

  const removed = await page.request.delete(`/api/v1/work-items/${item.id}`);
  expect(removed.ok()).toBeTruthy();

  const after = await page.request.get('/api/v1/work-items');
  expect(after.ok()).toBeTruthy();
  const titles = ((await after.json()).items || []).map((row: { title: string }) => row.title);
  expect(titles).not.toContain(title);
  await removeReleaseChecks(page);
});
