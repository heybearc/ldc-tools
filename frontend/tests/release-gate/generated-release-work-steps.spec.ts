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
  let list = await page.request.get('/api/v1/processes');
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
    list = await page.request.get('/api/v1/processes');
  }
  expect(list.ok()).toBeTruthy();
  return list.json();
}

test('starting a process keeps the project and confirms it started', async ({ page }) => {
  await signIn(page);
  const processes = await ensureGroup(page);
  if (!processes.canPost) return;

  const stamp = Date.now();
  const name = `Release check start ${stamp}`;
  const created = await page.request.post('/api/v1/processes', {
    data: {
      name,
      appliesTo: 'PROJECT',
      cadence: 'ONCE',
      steps: [{ title: `QA check ${stamp}`, detail: 'Mark this step.' }],
    },
  });
  expect(created.status()).toBe(201);
  const template = await created.json();
  const published = await page.request.post(`/api/v1/processes/${template.id}/publish`, { data: { publish: true } });
  expect(published.ok()).toBeTruthy();

  await page.goto('/processes');
  const card = page.locator('article').filter({ has: page.getByRole('heading', { name }) });
  const select = card.getByLabel(`Project for ${name}`);
  const projectId = await select.locator('option').nth(1).getAttribute('value');
  if (projectId) await select.selectOption(projectId);
  await card.getByRole('button', { name: 'Add to project' }).click();
  if (!projectId) {
    await expect(page.getByText('Choose a project for this process')).toBeVisible();
    return;
  }
  await expect(page.getByText(/Added to /)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Work' })).toBeVisible();
  await expect(select).toHaveValue(projectId);
});

test('an assignee can check a step and return the work to the pool', async ({ page }) => {
  await signIn(page);
  const processes = await ensureGroup(page);
  if (!processes.canPost) return;

  const stamp = Date.now();
  const created = await page.request.post('/api/v1/processes', {
    data: {
      name: `QA pool ${stamp}`,
      steps: [{ title: `QA step ${stamp}`, detail: 'Check this step.' }],
    },
  });
  expect(created.status()).toBe(201);
  const template = await created.json();
  const published = await page.request.post(`/api/v1/processes/${template.id}/publish`, { data: { publish: true } });
  expect(published.ok()).toBeTruthy();
  const started = await page.request.post(`/api/v1/processes/${template.id}/start`, { data: { projectId: null } });
  expect(started.status()).toBe(201);
  const run = await started.json();
  const workId = run.item.id as string;
  const stepId = run.item.steps[0].id as string;

  const claim = await page.request.post(`/api/v1/work-items/${workId}/claim`);
  expect(claim.ok()).toBeTruthy();

  const checked = await page.request.patch(`/api/v1/work-items/${workId}/steps/${stepId}`, { data: { done: true } });
  expect(checked.ok()).toBeTruthy();
  expect((await checked.json()).done).toBe(true);

  const listed = await page.request.get('/api/v1/work-items');
  expect(listed.ok()).toBeTruthy();
  const items = (await listed.json()).items as Array<{ id: string; steps: Array<{ id: string; done: boolean }> }>;
  const item = items.find((candidate) => candidate.id === workId);
  expect(item?.steps.find((step) => step.id === stepId)?.done).toBe(true);

  const released = await page.request.post(`/api/v1/work-items/${workId}/release`);
  expect(released.ok()).toBeTruthy();
  const pool = await released.json();
  expect(pool.assigneeId).toBeNull();
  expect(pool.claimable).toBe(true);

  const again = await page.request.post(`/api/v1/work-items/${workId}/claim`);
  expect(again.ok()).toBeTruthy();
  const done = await page.request.patch(`/api/v1/work-items/${workId}`, { data: { status: 'DONE' } });
  expect(done.ok()).toBeTruthy();
  expect((await done.json()).status).toBe('DONE');
});

test('the phone app opens claimed work and the team chat', async ({ page }) => {
  await signIn(page);
  const processes = await ensureGroup(page);
  const signedIn = await page.request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signedIn.ok()).toBeTruthy();
  const session = await signedIn.json();
  const headers = { Authorization: `Bearer ${session.token}` };

  const unsigned = await page.request.get('/api/v1/mobile/chat');
  expect(unsigned.status()).toBe(401);

  const chat = await page.request.get('/api/v1/mobile/chat', { headers });
  expect(chat.ok()).toBeTruthy();
  const rooms = await chat.json();
  expect(Array.isArray(rooms.channels)).toBe(true);
  expect(rooms.channels.some((channel: { title?: string }) => channel.title === 'Team chat')).toBe(true);

  if (!processes.canPost) return;
  const stamp = Date.now();
  const created = await page.request.post('/api/v1/processes', {
    data: {
      name: `QA phone ${stamp}`,
      steps: [{ title: `QA phone step ${stamp}`, detail: 'Open this on the phone.' }],
    },
  });
  expect(created.status()).toBe(201);
  const template = await created.json();
  const published = await page.request.post(`/api/v1/processes/${template.id}/publish`, { data: { publish: true } });
  expect(published.ok()).toBeTruthy();
  const started = await page.request.post(`/api/v1/processes/${template.id}/start`, { data: {} });
  expect(started.status()).toBe(201);
  const workId = (await started.json()).item.id as string;

  const claim = await page.request.post(`/api/v1/mobile/work/${workId}/claim`, { headers });
  expect(claim.ok()).toBeTruthy();
  const detail = await page.request.get(`/api/v1/mobile/work/${workId}`, { headers });
  expect(detail.ok()).toBeTruthy();
  const body = await detail.json();
  expect(body.mine).toBe(true);
  expect(body.steps.length).toBeGreaterThan(0);

  const step = await page.request.patch(`/api/v1/mobile/work/${workId}/steps/${body.steps[0].id}`, {
    headers,
    data: { done: true },
  });
  expect(step.ok()).toBeTruthy();
  const released = await page.request.post(`/api/v1/mobile/work/${workId}/release`, { headers });
  expect(released.ok()).toBeTruthy();
  expect((await released.json()).assigneeId).toBeNull();
});
