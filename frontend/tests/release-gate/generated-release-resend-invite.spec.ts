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

test('resending an invitation asks in a notice before any email is sent', async ({ page }) => {
  await signIn(page);

  const usersResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/admin/users') && !response.url().includes('/stats') && response.ok()
  );
  await page.goto('/admin/users');
  const payload = await (await usersResponse).json();
  const invited = (payload.users || []).find((user: { status: string; email: string }) => user.status === 'INVITED' && user.email);
  expect(invited, 'standby needs an invited person to cover resend').toBeTruthy();

  let resendCalled = false;
  page.on('request', (request) => {
    if (request.url().includes('/resend-invite') && request.method() === 'POST') {
      resendCalled = true;
    }
  });

  const row = page.locator('tr').filter({ hasText: invited.email });
  await row.getByTitle('More actions').click();
  await page.getByRole('button', { name: 'Resend Invitation' }).click();

  const notice = page.getByText('Resend the invitation email to this person?');
  await expect(notice).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click();
  await expect(notice).toHaveCount(0);
  expect(resendCalled).toBe(false);
});
