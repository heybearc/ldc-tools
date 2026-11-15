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
}

test('work and processes show a publish date and can be sorted by it', async ({ page }) => {
  await signIn(page);
  await ensureGroup(page);

  const stamp = Date.now();
  const workTitle = `Release check published ${stamp}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title: workTitle,
      detail: 'Release check for the published date.',
      timingKind: 'NONE',
      claimable: false,
    },
  });
  expect(created.status()).toBe(201);
  const work = await created.json();
  expect(work.createdAt).toBeTruthy();

  await page.goto('/work');
  await expect(page.getByRole('button', { name: 'Newest' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Oldest' })).toBeVisible();
  await page.getByRole('button', { name: 'Newest' }).click();
  const workRow = page.locator('article, div').filter({ has: page.getByRole('heading', { name: workTitle, exact: true }) }).first();
  await expect(workRow.getByText(/Published \w+ \d{1,2}, \d{4}/)).toBeVisible();
  await page.getByRole('button', { name: 'Oldest' }).click();
  await expect(workRow.getByText(/Published \w+ \d{1,2}, \d{4}/)).toBeVisible();

  const processName = `Release check process ${stamp}`;
  const draft = await page.request.post('/api/v1/processes', {
    data: {
      name: processName,
      appliesTo: 'TEAM',
      cadence: 'ONCE',
      steps: [{ title: 'Release check task', detail: 'One task.' }],
    },
  });
  expect(draft.status()).toBe(201);
  const template = await draft.json();
  expect(template.publishedAt).toBeNull();
  expect(template.createdAt).toBeTruthy();

  const published = await page.request.post(`/api/v1/processes/${template.id}/publish`, {
    data: { publish: true },
  });
  expect(published.ok()).toBeTruthy();
  const live = await published.json();
  expect(live.publishedAt).toBeTruthy();

  await page.goto('/processes');
  await expect(page.getByRole('button', { name: 'Newest' })).toBeVisible();
  await page.getByRole('button', { name: 'Newest' }).click();
  const processCard = page.locator('article').filter({ hasText: processName });
  await expect(processCard.getByText(/Published \w+ \d{1,2}, \d{4}/)).toBeVisible();
  await page.getByRole('button', { name: 'Oldest' }).click();
  await expect(processCard.getByText(/Published \w+ \d{1,2}, \d{4}/)).toBeVisible();

  const feedback = await page.request.get('/api/v1/admin/feedback');
  expect(feedback.ok()).toBeTruthy();
  const feedbackBody = await feedback.json();
  const items = feedbackBody.data?.feedback || [];
  for (const item of items.slice(0, 5)) {
    expect(item.feedbackNumber).toMatch(/^FB-\d+$/);
  }
});
