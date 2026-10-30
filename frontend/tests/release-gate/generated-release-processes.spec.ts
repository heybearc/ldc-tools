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

test('starting a process puts its steps on the work list', async ({ page }) => {
  await signIn(page);

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
  const processes = await list.json();
  expect(Array.isArray(processes.templates)).toBeTruthy();
  expect(typeof processes.canPost).toBe('boolean');

  await page.goto('/processes');
  await expect(page.getByRole('heading', { name: 'Processes', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Processes' }).first()).toBeVisible();

  const empty = await page.request.post('/api/v1/processes', { data: { name: 'QA empty', steps: [] } });
  if (!processes.canPost) {
    expect(empty.status()).toBe(403);
    return;
  }
  expect(empty.status()).toBe(400);

  const stamp = Date.now();
  const name = `QA process ${stamp}`;
  const first = `QA step one ${stamp}`;
  const second = `QA step two ${stamp}`;
  const created = await page.request.post('/api/v1/processes', {
    data: {
      name,
      steps: [
        { title: first, detail: 'Open the file.', explanation: 'Use the current drawing.' },
        { title: second, detail: 'Send the note.', explanation: 'Copy the requestor.' },
      ],
    },
  });
  expect(created.status()).toBe(201);
  const template = await created.json();

  const projectId = processes.projects?.[0]?.id || null;
  const started = await page.request.post(`/api/v1/processes/${template.id}/start`, {
    data: { projectId },
  });
  expect(started.status()).toBe(201);
  const run = await started.json();
  expect(run.items).toHaveLength(2);

  await page.goto('/work');
  const firstRow = page.locator('article').filter({ hasText: first });
  const secondRow = page.locator('article').filter({ hasText: second });
  await expect(firstRow.getByRole('heading', { name: first })).toBeVisible();
  await expect(firstRow.getByText('Use the current drawing.')).toBeVisible();
  await expect(secondRow.getByText('Copy the requestor.')).toBeVisible();

  for (const item of run.items) {
    const done = await page.request.patch(`/api/v1/work-items/${item.id}`, { data: { status: 'DONE' } });
    expect(done.ok()).toBeTruthy();
  }
});
