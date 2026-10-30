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

test('a dated project item shows on the project and on the work list', async ({ page }) => {
  await signIn(page);

  let summary = await page.request.get('/api/v1/projects/summary');
  if (summary.status() === 403) {
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
    summary = await page.request.get('/api/v1/projects/summary');
  }

  expect(summary.ok()).toBeTruthy();
  const list = await summary.json();
  expect(Array.isArray(list.projects)).toBeTruthy();
  expect(typeof list.canAddDate).toBe('boolean');
  for (const project of list.projects) {
    expect(Array.isArray(project.schedule)).toBeTruthy();
  }

  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

  const project = list.projects[0];
  if (!project) {
    await expect(page.getByText('No projects for this construction group.')).toBeVisible();
    return;
  }

  const card = page.locator('article').filter({ hasText: project.name });
  await expect(card.getByText('Schedule')).toBeVisible();

  if (!list.canAddDate) {
    await expect(card.getByRole('button', { name: 'Add date' })).toHaveCount(0);
    return;
  }

  const title = `QA schedule ${Date.now()}`;
  const created = await page.request.post('/api/v1/work-items', {
    data: {
      title,
      detail: 'PPS meeting prep',
      timingKind: 'PROJECT_DATE',
      dueOn: '2026-12-15',
      projectId: project.id,
      claimable: false,
    },
  });
  expect(created.status()).toBe(201);
  const item = await created.json();
  expect(item.timingKind).toBe('PROJECT_DATE');
  expect(item.timingLabel).toContain('Dec 15, 2026');
  expect(item.project?.name).toBe(project.name);

  const missingDate = await page.request.post('/api/v1/work-items', {
    data: {
      title: `QA schedule missing ${Date.now()}`,
      detail: 'This date is required.',
      timingKind: 'PROJECT_DATE',
      projectId: project.id,
    },
  });
  expect(missingDate.status()).toBe(400);

  await page.reload();
  await expect(card.getByText(title)).toBeVisible();
  await expect(card.getByText('Dec 15, 2026')).toBeVisible();
  await expect(card.getByText('PPS meeting prep')).toBeVisible();

  await page.goto('/work');
  const workRow = page.locator('article').filter({ hasText: title });
  await expect(workRow.getByRole('heading', { name: title })).toBeVisible();
  await expect(workRow.getByText(/Dec 15, 2026/)).toBeVisible();

  const done = await page.request.patch(`/api/v1/work-items/${item.id}`, {
    data: { status: 'DONE' },
  });
  expect(done.ok()).toBeTruthy();
});
