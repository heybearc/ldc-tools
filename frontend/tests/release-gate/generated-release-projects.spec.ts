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

test('oversight can list construction-group projects and assign Personnel', async ({ page }) => {
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
  expect(typeof list.canAssign).toBe('boolean');

  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Projects' }).first()).toBeVisible();
  await expect(page.getByText('Crews, budget, and congregations stay off this list.')).toBeVisible();

  await page.goto('/projects/not-a-project');
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

  const missingPerson = await page.request.post('/api/v1/projects/not-a-project/personnel', {
    data: { userId: '' },
  });
  if (list.canAssign) {
    expect(missingPerson.status()).toBe(400);
  } else {
    expect(missingPerson.status()).toBe(403);
    await expect(page.getByRole('button', { name: 'Assign' })).toHaveCount(0);
    return;
  }

  const project = list.projects[0];
  const person = (list.personnel || []).find(
    (candidate: { id: string }) => !project?.personnel?.some((assigned: { id: string }) => assigned.id === candidate.id),
  );
  if (!project || !person) {
    await expect(page.getByText(/No projects for this construction group|No one assigned|Personnel/).first()).toBeVisible();
    return;
  }

  const assigned = await page.request.post(`/api/v1/projects/${project.id}/personnel`, {
    data: { userId: person.id },
  });
  expect(assigned.ok()).toBeTruthy();

  await page.goto('/projects');
  const card = page.locator('article').filter({ hasText: project.name });
  await expect(card.getByText(person.name || person.email)).toBeVisible();

  const removed = await page.request.delete(
    `/api/v1/projects/${project.id}/personnel?userId=${encodeURIComponent(person.id)}`,
  );
  expect(removed.ok()).toBeTruthy();

  await page.reload();
  await expect(card.getByRole('button', { name: `Remove ${person.name || person.email}` })).toHaveCount(0);
});
