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

test('email test uses the saved app password when the form password is blank', async ({ page }) => {
  await signIn(page);

  const response = await page.request.post('/api/v1/admin/email/test', {
    data: {
      testEmail: TEST_USER.email,
      config: {
        provider: 'GMAIL',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        encryption: 'tls',
        fromEmail: 'no-reply.ldctools@gmail.com',
        fromName: 'LDC Tools',
        username: 'corya1992@gmail.com',
      },
    },
  });
  const body = await response.json();
  const message = String(body.message || '');

  expect(message).not.toContain('app password is missing');
  expect(message).not.toContain('Missing credentials');
  expect(response.ok(), message).toBeTruthy();
  expect(body.success).toBe(true);
});
