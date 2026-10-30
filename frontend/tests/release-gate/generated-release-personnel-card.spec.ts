import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

const PERSONNEL_ROLES = ['PC', 'PCA', 'PC_SUPPORT', 'PC-Support'];

async function signIn(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15000 });
}

test('sign-in opens the dashboard and Personnel is not on the construction group card', async ({ page }) => {
  await signIn(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

  const overviewResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/trade-teams/overview') && response.ok()
  );
  await page.goto('/trade-teams/overview');
  const payload = await (await overviewResponse).json();
  const groups = payload.directoryGroups;
  const roles = (columns: { contact?: { role: string }[]; assistant?: { role: string }[]; support?: { role: string }[] }) =>
    [...(columns?.contact || []), ...(columns?.assistant || []), ...(columns?.support || [])].map((person) => person.role);

  expect(roles(groups?.constructionGroup).some((role) => PERSONNEL_ROLES.includes(role))).toBe(false);
  expect(roles(groups?.personnel).every((role) => PERSONNEL_ROLES.includes(role))).toBe(true);

  await expect(page.getByRole('heading', { name: 'Construction group', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Personnel', exact: true })).toBeVisible();
});
