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

test('the construction group can open a shared reference list', async ({ page }) => {
  await signIn(page);

  let list = await page.request.get('/api/v1/references');
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
    list = await page.request.get('/api/v1/references');
  }

  expect(list.ok()).toBeTruthy();
  const references = await list.json();
  expect(Array.isArray(references.links)).toBeTruthy();
  expect(typeof references.canManage).toBe('boolean');

  await page.goto('/references');
  await expect(page.getByRole('heading', { name: 'References' })).toBeVisible();

  if (!references.canManage) return;

  const title = `Release check reference ${Date.now()}`;
  const created = await page.request.post('/api/v1/references', {
    data: {
      title,
      url: 'https://example.com/ldc-reference',
      category: 'Release check',
      note: 'Temporary link from the release test',
    },
  });
  expect(created.status()).toBe(201);
  const createdBody = await created.json();
  const id = createdBody.link?.id as string;
  expect(id).toBeTruthy();

  await page.reload();
  await expect(page.getByRole('link', { name: title })).toBeVisible();

  const removed = await page.request.delete(`/api/v1/references/${id}`);
  expect(removed.ok()).toBeTruthy();
});
