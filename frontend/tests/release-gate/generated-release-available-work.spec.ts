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

test('claimable work says it is available and the personnel count endpoint answers', async ({ page }) => {
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

  const title = `Release check available ${Date.now()}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title,
      detail: 'Release check for work that is waiting to be claimed.',
      timingKind: 'NONE',
      claimable: true,
    },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();

  const listed = await page.request.get('/api/v1/work-items');
  expect(listed.ok()).toBeTruthy();
  const waiting = ((await listed.json()).items || []).filter((row: {
    status: string;
    claimable: boolean;
    assignee: { id: string } | null;
  }) => row.status === 'OPEN' && row.claimable && !row.assignee);
  const sentence = waiting.length === 1
    ? '1 task is available to claim.'
    : `${waiting.length} tasks are available to claim.`;

  await page.goto('/work');
  await expect(page.getByText(sentence)).toBeVisible();

  const count = await page.request.get('/api/v1/work-items/available-count');
  expect(count.ok()).toBeTruthy();
  const countBody = await count.json();
  expect(typeof countBody.count).toBe('number');
  expect(countBody.count).toBeGreaterThanOrEqual(0);

  const signedIn = await page.request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signedIn.ok()).toBeTruthy();
  const session = await signedIn.json();
  const phoneCount = await page.request.get('/api/v1/mobile/work/available-count', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(phoneCount.ok()).toBeTruthy();
  expect(typeof (await phoneCount.json()).count).toBe('number');

  const removed = await page.request.delete(`/api/v1/work-items/${item.id}`);
  expect(removed.ok()).toBeTruthy();
  await removeReleaseChecks(page);
});
