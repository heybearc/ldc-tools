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

test('a super admin stays in a construction group and can add work or a project', async ({ page }) => {
  await signIn(page);

  const work = await page.request.get('/api/v1/work-items');
  expect(work.status(), await work.text()).not.toBe(403);
  const workBody = await work.json();
  expect(work.ok()).toBeTruthy();
  expect(workBody.canAssign).toBe(true);

  await page.goto('/work');
  await expect(page.getByRole('heading', { name: 'Work', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add work' })).toBeVisible();
  await expect(page.getByText('No construction group assigned')).toHaveCount(0);

  const projects = await page.request.get('/api/v1/projects/summary');
  expect(projects.ok()).toBeTruthy();
  await page.goto('/projects');
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add project' })).toBeVisible();

  await page.goto('/');
  await page.getByRole('link', { name: 'Admin', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Admin Control Center' })).toBeVisible();

  await page.goto('/admin/users');
  await expect(page.getByText('Personnel team for this region')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeInViewport();
});
