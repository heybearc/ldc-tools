import { test, expect, type Page } from '@playwright/test';
import './cleanup-release-checks';

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

test('turning email off for selected work clears the requestor checkbox', async ({ page }) => {
  await signIn(page);

  const task = {
    id: 'w-email-off',
    title: 'Mail the requestor',
    detail: 'Finish the drawing.',
    explanation: null,
    referenceUrl: null,
    timingKind: 'NONE',
    timingLabel: 'No deadline',
    project: null,
    claimable: false,
    status: 'OPEN',
    assignee: null,
    requestorName: 'Pat',
    requestorEmail: 'pat@example.com',
    notifyRequestor: true,
    completedAt: null,
    steps: [],
    notes: [],
  };

  await page.route('**/api/v1/work-items**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/v1/work-items/notify')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ updated: 1, ids: [task.id], notifyRequestor: false }),
      });
      return;
    }
    if (route.request().method() !== 'GET' || !url.includes('/api/v1/work-items')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        canAssign: true,
        currentUserId: 'user-1',
        items: [{ ...task, notifyRequestor: true }],
        teammates: [],
        projects: [],
        processes: [],
      }),
    });
  });

  await page.goto('/work');
  const row = page.locator('article').filter({ hasText: task.title });
  const emailBox = row.getByRole('checkbox', { name: 'Email the requestor when this is done' });
  await expect(emailBox).toBeChecked();
  await row.getByRole('checkbox', { name: `Select ${task.title}` }).click();
  await page.getByRole('button', { name: 'Email off' }).click();
  await expect(page.getByText('Completion email is off for 1 task.')).toBeVisible();
  await expect(emailBox).not.toBeChecked();
});

test('completion email stays off after it is saved', async ({ page }) => {
  await signIn(page);
  const list = await ensureGroup(page);
  expect(list.canAssign).toBe(true);

  const stamp = Date.now();
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title: `QA email off ${stamp}`,
      detail: 'Release check for turning completion email off.',
      timingKind: 'NONE',
      claimable: false,
      requestorName: 'Pat',
      requestorEmail: 'qa-crew@example.com',
    },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();
  expect(item.notifyRequestor).not.toBe(false);

  const turnedOff = await page.request.post('/api/v1/work-items/notify', {
    data: { ids: [item.id], notifyRequestor: false },
  });
  expect(turnedOff.ok()).toBeTruthy();
  const saved = await turnedOff.json();
  expect(saved.notifyRequestor).toBe(false);
  expect(saved.ids).toContain(item.id);

  const turnedOn = await page.request.post('/api/v1/work-items/notify', {
    data: { ids: [item.id], notifyRequestor: true },
  });
  expect(turnedOn.ok()).toBeTruthy();
  expect((await turnedOn.json()).notifyRequestor).toBe(true);
});
