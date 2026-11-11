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

test('a phone number is formatted as you type and a partial number is rejected', async ({ page }) => {
  await signIn(page);
  await page.goto('/trade-teams/overview');
  await page.getByRole('button', { name: 'Add person' }).click();
  const dialog = page.locator('.fixed').filter({ has: page.getByRole('heading', { name: 'Add person' }) });
  const phone = dialog.getByPlaceholder('(555) 555-5555');
  await phone.fill('2024561414');
  await expect(phone).toHaveValue('(202) 456-1414');
  await dialog.getByRole('button', { name: 'Cancel' }).click();

  const rejected = await page.request.post('/api/v1/trade-teams/directory', {
    data: {
      scope: 'personnel',
      firstName: 'Release',
      lastName: 'Phone',
      email: `release-phone-${Date.now()}@example.com`,
      phone: '12',
      role: 'PC',
    },
  });
  expect(rejected.status()).toBe(400);
  const body = await rejected.json();
  expect(body.error).toContain('(555) 555-5555');
});
