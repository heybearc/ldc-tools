import { test, expect } from '@playwright/test';

test('privacy and support pages are public for an invite-only app', async ({ page }) => {
  const privacy = await page.goto('/privacy');
  expect(privacy?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible();
  await expect(page.getByText(/invite-only/i).first()).toBeVisible();
  await expect(page).not.toHaveURL(/signin/);

  const support = await page.goto('/support');
  expect(support?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Support' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  await expect(page).not.toHaveURL(/signin/);
});

test('an incomplete support request is rejected', async ({ request }) => {
  const response = await request.post('/api/v1/public/support', {
    data: { name: 'Review', email: 'not-an-email', message: 'hi', kind: 'access' },
  });
  expect(response.status()).toBe(400);
});

test('a bot support post is ignored', async ({ request }) => {
  const response = await request.post('/api/v1/public/support', {
    data: {
      company: 'bot',
      name: 'Bot',
      email: 'bot@example.com',
      message: 'please ignore this note',
      kind: 'access',
    },
  });
  expect(response.ok()).toBeTruthy();
});

test('account deletion and chat blocks require a sign-in', async ({ request }) => {
  const deleted = await request.post('/api/v1/auth/mobile/delete-account');
  expect(deleted.status()).toBe(401);
  const blocks = await request.get('/api/v1/mobile/chat/blocks');
  expect(blocks.status()).toBe(401);
});
