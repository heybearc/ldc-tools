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

test('waiting work counts for a signed-in person, and assigning it sticks', async ({ page }) => {
  await signIn(page);

  let list = await page.request.get('/api/v1/work-items');
  if (list.status() === 403) {
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
    list = await page.request.get('/api/v1/work-items');
  }

  expect(list.ok()).toBeTruthy();
  const work = await list.json();
  const teammates = work.teammates || [];
  expect(Array.isArray(teammates)).toBeTruthy();

  const title = `Release check alert ${Date.now()}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title,
      detail: 'Release check for a claimable task.',
      timingKind: 'NONE',
      claimable: true,
    },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();

  const count = await page.request.get('/api/v1/work-items/available-count');
  expect(count.ok()).toBeTruthy();
  const countBody = await count.json();
  expect(countBody.count).toBeGreaterThan(0);

  const profile = await page.request.get('/api/v1/user/profile');
  expect(profile.ok()).toBeTruthy();
  const me = (await profile.json()).user?.id as string;
  const other = teammates.find((person: { id: string }) => person.id && person.id !== me);
  if (other?.id) {
    const assigned = await page.request.post('/api/v1/work-items/assign', {
      data: { ids: [item.id], assigneeId: other.id },
    });
    expect(assigned.ok()).toBeTruthy();
    const after = await page.request.get('/api/v1/work-items');
    expect(after.ok()).toBeTruthy();
    const rows = (await after.json()).items || [];
    const row = rows.find((entry: { id: string }) => entry.id === item.id);
    expect(row?.assignee?.id).toBe(other.id);
  }

  const removed = await page.request.delete(`/api/v1/work-items/${item.id}`);
  expect(removed.ok()).toBeTruthy();
  await removeReleaseChecks(page);
});
