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

test('a construction-group directory person does not get a sign-in account', async ({ page }) => {
  await signIn(page);

  let probe = await page.request.get('/api/v1/trade-teams/overview');
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
  }

  const email = `release-check-directory+${Date.now()}@example.com`;
  const created = await page.request.post('/api/v1/trade-teams/directory', {
    data: {
      scope: 'construction-group',
      firstName: 'Release check',
      lastName: 'Directory',
      email,
      role: 'CG-Support',
    },
  });
  expect(created.status()).toBe(201);

  const accounts = await page.request.get(`/api/v1/admin/users?search=${encodeURIComponent(email)}`);
  expect(accounts.ok()).toBeTruthy();
  const listed = JSON.stringify(await accounts.json());
  expect(listed).not.toContain(email);

  const overview = await page.request.get('/api/v1/trade-teams/overview');
  expect(overview.ok()).toBeTruthy();
  expect(JSON.stringify(await overview.json())).toContain('Release check Directory');

  await removeReleaseChecks(page);
});
