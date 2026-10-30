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

test('work uses the construction group already chosen in the header', async ({ page }) => {
  await signIn(page);
  const groups = await page.request.get('/api/v1/construction-groups');
  expect(groups.ok()).toBeTruthy();
  const body = await groups.json();
  const group = (body.constructionGroups || []).find((item: { code?: string }) => item.code?.includes('01.12')) || body.constructionGroups?.[0];
  expect(group?.id).toBeTruthy();

  await page.addInitScript((groupId) => {
    localStorage.setItem('selectedCG', groupId as string);
  }, group.id);
  const cleared = await page.request.post('/api/v1/user/set-cg-filter', {
    data: { constructionGroupId: null },
  });
  expect(cleared.ok()).toBeTruthy();

  const ready = page.waitForResponse(
    (response) => response.url().includes('/api/v1/work-items') && response.request().method() === 'GET' && response.ok(),
  );
  await page.goto('/work');
  await ready;
  await expect(page.getByRole('heading', { name: 'Work', exact: true })).toBeVisible();
  await expect(page.getByText('No construction group assigned')).toHaveCount(0);
});

test('a task can have no deadline and several tasks can be assigned together', async ({ page }) => {
  await signIn(page);
  const list = await ensureGroup(page);
  expect(list.canAssign).toBe(true);
  const assignee = list.teammates?.find((person: { id: string }) => person.id === list.currentUserId) || list.teammates?.[0];
  expect(assignee?.id).toBeTruthy();

  const stamp = Date.now();
  const firstTitle = `QA no deadline ${stamp}`;
  const secondTitle = `QA no deadline next ${stamp}`;
  const created = [];
  for (const title of [firstTitle, secondTitle]) {
    const response = await page.request.post('/api/v1/work-items', {
      data: {
        title,
        detail: 'Release check for a task with no deadline.',
        timingKind: 'NONE',
        claimable: true,
      },
    });
    expect(response.status()).toBe(201);
    const item = await response.json();
    expect(item.timingLabel).toBe('No deadline');
    expect(item.dueOn).toBeNull();
    created.push(item);
  }

  const assigned = await page.request.post('/api/v1/work-items/assign', {
    data: { ids: created.map((item) => item.id), assigneeId: assignee.id },
  });
  expect(assigned.ok()).toBeTruthy();
  expect((await assigned.json()).assigned).toBe(2);

  await page.goto('/work');
  const row = page.locator('article').filter({ hasText: firstTitle });
  await expect(row.getByText('No deadline', { exact: true })).toBeVisible();
  await expect(row.getByRole('checkbox', { name: `Select ${firstTitle}` })).toBeVisible();
  await expect(row.getByText(assignee.name || assignee.email)).toBeVisible();

  for (const item of created) {
    const done = await page.request.patch(`/api/v1/work-items/${item.id}`, { data: { status: 'DONE' } });
    expect(done.ok()).toBeTruthy();
  }
});
