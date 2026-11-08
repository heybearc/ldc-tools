import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

test('the phone reports who may add a project or a trade team', async ({ request }) => {
  const pageSignIn = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(pageSignIn.ok()).toBeTruthy();
  const session = await pageSignIn.json();
  const headers = { Authorization: `Bearer ${session.token}` };

  const projects = await request.get('/api/v1/mobile/projects', { headers });
  expect(projects.ok()).toBeTruthy();
  const projectBody = await projects.json();
  expect(typeof projectBody.canCreate).toBe('boolean');
  expect(typeof projectBody.canManage).toBe('boolean');

  const teams = await request.get('/api/v1/mobile/trade-teams', { headers });
  expect(teams.ok()).toBeTruthy();
  const teamBody = await teams.json();
  expect(typeof teamBody.canManage).toBe('boolean');
});

test('a test message to an example address is not handed to the mail server', async ({ page }) => {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15000 });

  const response = await page.request.post('/api/v1/admin/email/test', {
    data: {
      testEmail: 'qa-crew@example.com',
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
  expect(response.ok(), message).toBeTruthy();
  expect(body.success).toBe(true);
  expect(message).toContain('cannot receive mail');
  expect(message).not.toContain('sent successfully');
});
