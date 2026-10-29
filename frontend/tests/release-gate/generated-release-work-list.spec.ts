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

test('personnel can post a task, see its timing, and claim a claimable one', async ({ page }) => {
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
  const list = await probe.json();
  expect(list.canAssign).toBe(true);

  await page.goto('/work');
  await expect(page.getByRole('heading', { name: 'Work', exact: true })).toBeVisible();

  const stamp = Date.now();
  const deadlineTitle = `QA deadline ${stamp}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title: deadlineTitle,
      detail: 'Release check for a deadline.',
      timingKind: 'DEADLINE',
      dueOn: '2026-12-15',
      claimable: false,
    },
  });
  expect(created.status()).toBe(201);
  const deadline = await created.json();
  expect(deadline.timingLabel).toBe('Dec 15, 2026');

  const missingDate = await page.request.post('/api/v1/work-items', {
    data: {
      title: `QA missing date ${stamp}`,
      detail: 'This date is required.',
      timingKind: 'DEADLINE',
    },
  });
  expect(missingDate.status()).toBe(400);

  const claimTitle = `QA claim ${stamp}`;
  const claimable = await page.request.post('/api/v1/work-items', {
    data: {
      title: claimTitle,
      detail: 'Release check for a claim.',
      timingKind: 'MONTHLY',
      claimable: true,
    },
  });
  expect(claimable.status()).toBe(201);
  const claimItem = await claimable.json();
  expect(claimItem.timingLabel).toBe('Monthly');
  expect(claimItem.assignee).toBeNull();

  const claim = await page.request.post(`/api/v1/work-items/${claimItem.id}/claim`);
  expect(claim.ok()).toBeTruthy();
  const claimed = await claim.json();
  expect(claimed.assigneeId).toBe(list.currentUserId);

  await page.reload();
  await expect(page.getByRole('heading', { name: deadlineTitle })).toBeVisible();
  await expect(page.getByText('Dec 15, 2026').first()).toBeVisible();
  const claimRow = page.locator('article').filter({ hasText: claimTitle });
  await expect(claimRow.getByText('Monthly')).toBeVisible();
  await expect(claimRow.getByRole('button', { name: 'Claim' })).toHaveCount(0);

  const doneDeadline = await page.request.patch(`/api/v1/work-items/${deadline.id}`, {
    data: { status: 'DONE' },
  });
  const doneClaim = await page.request.patch(`/api/v1/work-items/${claimItem.id}`, {
    data: { status: 'DONE' },
  });
  expect(doneDeadline.ok()).toBeTruthy();
  expect(doneClaim.ok()).toBeTruthy();
});
