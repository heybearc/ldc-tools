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

test('the directory lists construction group and ancillary people for this group', async ({ page }) => {
  await signIn(page);

  const overviewResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/trade-teams/overview') && response.ok()
  );
  await page.goto('/trade-teams/overview');
  const payload = await (await overviewResponse).json();

  expect(payload.directoryGroups?.personnel?.contact).toBeDefined();
  expect(payload.directoryGroups?.personnel?.assistant).toBeDefined();
  expect(payload.directoryGroups?.personnel?.support).toBeDefined();
  expect(Array.isArray(payload.directoryGroups?.ancillary)).toBe(true);

  await expect(page.getByRole('heading', { name: 'Directory' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Construction group', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ancillary', exact: true })).toBeVisible();
  await expect(page.getByText('Contact', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Assistant', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Support', { exact: true }).first()).toBeVisible();
});

test('the construction group hierarchy editor is not in admin', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/organization');
  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByRole('heading', { name: 'Admin Control Center' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Organization' })).toHaveCount(0);
});
