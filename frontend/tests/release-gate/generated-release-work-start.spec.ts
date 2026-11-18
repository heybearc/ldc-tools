import { test, expect, type Page } from '@playwright/test';
import { revealWork, removeReleaseChecks } from './cleanup-release-checks';

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

async function ensureGroup(page: Page) {
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
  return probe.json();
}

test('a task shows Start, then Finished, and a later claim starts over', async ({ page }) => {
  await signIn(page);
  await removeReleaseChecks(page);
  const list = await ensureGroup(page);
  const assignee = list.teammates?.find((person: { id: string }) => person.id === list.currentUserId) || list.teammates?.[0];
  expect(assignee?.id).toBeTruthy();

  const stamp = Date.now();
  const buttonTitle = `Release check start button ${stamp}`;
  const claimTitle = `Release check start over ${stamp}`;
  const created = [];
  for (const title of [buttonTitle, claimTitle]) {
    const response = await page.request.post('/api/v1/work-items', {
      data: {
        title,
        detail: 'Release check for Start, then Finished.',
        timingKind: 'NONE',
        claimable: true,
      },
    });
    expect(response.status()).toBe(201);
    created.push(await response.json());
  }

  const assigned = await page.request.post('/api/v1/work-items/assign', {
    data: { ids: created.map((item) => item.id), assigneeId: assignee.id },
  });
  expect(assigned.ok()).toBeTruthy();

  const blocked = await page.request.patch(`/api/v1/work-items/${created[0].id}`, { data: { status: 'DONE' } });
  expect(blocked.status()).toBe(400);

  const heading = await revealWork(page, buttonTitle);
  const row = page.locator('article').filter({ has: heading });
  await expect(row.getByRole('button', { name: 'Finished', exact: true })).toHaveCount(0);
  await row.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Finished', exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Finished', exact: true }).click();
  const openSection = page.locator('section').filter({ has: page.getByRole('button', { name: 'Select all' }) });
  await expect(openSection.getByRole('heading', { name: buttonTitle, exact: true })).toHaveCount(0);
  const finishedSection = page.locator('details').filter({ has: page.getByText(/^Finished \(/) });
  await finishedSection.locator('summary').click();
  await expect(finishedSection.getByRole('heading', { name: buttonTitle, exact: true })).toBeVisible();
  await expect(finishedSection.getByRole('button', { name: 'Reopen', exact: true })).toBeVisible();

  const started = await page.request.patch(`/api/v1/work-items/${created[1].id}`, { data: { start: true } });
  expect(started.ok()).toBeTruthy();
  const released = await page.request.post(`/api/v1/work-items/${created[1].id}/release`);
  expect(released.ok()).toBeTruthy();
  const claimed = await page.request.post(`/api/v1/work-items/${created[1].id}/claim`);
  expect(claimed.ok()).toBeTruthy();

  const afterClaim = await page.request.get('/api/v1/work-items');
  expect(afterClaim.ok()).toBeTruthy();
  const claimedItem = ((await afterClaim.json()).items || []).find((item: { id: string }) => item.id === created[1].id);
  expect(claimedItem?.startedAt).toBeNull();

  const stillOpen = await page.request.patch(`/api/v1/work-items/${created[1].id}`, { data: { status: 'DONE' } });
  expect(stillOpen.status()).toBe(400);
  const restart = await page.request.patch(`/api/v1/work-items/${created[1].id}`, { data: { start: true } });
  expect(restart.ok()).toBeTruthy();
  const done = await page.request.patch(`/api/v1/work-items/${created[1].id}`, { data: { status: 'DONE' } });
  expect(done.ok()).toBeTruthy();
  expect((await done.json()).status).toBe('DONE');

  await removeReleaseChecks(page);
});
