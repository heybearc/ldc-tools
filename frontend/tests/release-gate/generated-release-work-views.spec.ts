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

test('work can be limited to a project, to overdue dates, and to email that is off', async ({ page }) => {
  await signIn(page);
  await removeReleaseChecks(page);

  const list = await page.request.get('/api/v1/work-items');
  expect(list.ok()).toBeTruthy();
  const body = await list.json();
  const project = (body.projects || [])[0] as { id: string; name: string } | undefined;

  const stamp = Date.now();
  const overdueTitle = `Release check overdue ${stamp}`;
  const laterTitle = `Release check later ${stamp}`;
  const emailTitle = `Release check email off ${stamp}`;

  const overdue = await page.request.post('/api/v1/work-items', {
    data: {
      title: overdueTitle,
      detail: 'Release check for an overdue date.',
      timingKind: project ? 'PROJECT_DATE' : 'DEADLINE',
      dueOn: '2020-01-02',
      projectId: project?.id,
      claimable: false,
    },
  });
  expect(overdue.status()).toBe(201);

  const later = await page.request.post('/api/v1/work-items', {
    data: {
      title: laterTitle,
      detail: 'Release check for a future date.',
      timingKind: 'DEADLINE',
      dueOn: '2099-01-02',
      claimable: false,
    },
  });
  expect(later.status()).toBe(201);

  const quiet = await page.request.post('/api/v1/work-items', {
    data: {
      title: emailTitle,
      detail: 'Release check for a requestor who is not emailed.',
      timingKind: 'NONE',
      claimable: false,
      requestorName: 'Release check',
      requestorEmail: 'release-check@example.com',
    },
  });
  expect(quiet.status()).toBe(201);
  const quietBody = await quiet.json();
  const silenced = await page.request.patch(`/api/v1/work-items/${quietBody.id}`, {
    data: { notifyRequestor: false },
  });
  expect(silenced.ok()).toBeTruthy();

  await page.goto('/work');
  await expect(page.getByRole('button', { name: /Overdue/ })).toBeVisible();
  await page.getByRole('button', { name: /Overdue/ }).click();
  await expect(page.getByRole('heading', { name: overdueTitle, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: laterTitle, exact: true })).toHaveCount(0);

  if (project) {
    await page.getByLabel('Project').selectOption(project.id);
    await expect(page.getByRole('heading', { name: overdueTitle, exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: laterTitle, exact: true })).toHaveCount(0);
    await page.getByLabel('Project').selectOption('');
  }

  await page.getByRole('button', { name: /Overdue/ }).click();
  await page.getByRole('button', { name: /Email off/ }).click();
  await expect(page.getByRole('heading', { name: emailTitle, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: overdueTitle, exact: true })).toHaveCount(0);

  await removeReleaseChecks(page);
});
