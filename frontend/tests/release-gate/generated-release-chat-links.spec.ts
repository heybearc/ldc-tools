import { test, expect, type Page } from '@playwright/test';
import './cleanup-release-checks';

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

async function ensureGroup(page: Page) {
  const probe = await page.request.get('/api/v1/chat');
  if (probe.status() !== 403) return probe;
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
  return page.request.get('/api/v1/chat');
}

test('a chat address is a link and the message box stays on screen', async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 640 });
  await signIn(page);

  const chat = await ensureGroup(page);
  expect(chat.ok()).toBeTruthy();
  const inbox = await chat.json();
  const team = (inbox.channels || []).find((channel: { kind?: string }) => channel.kind === 'TEAM');
  expect(team?.id).toBeTruthy();

  const address = `https://example.com/ldc-release-${Date.now()}`;
  const sent = await page.request.post(`/api/v1/chat/channels/${team.id}/messages`, {
    data: { body: `See ${address} for the drawing.` },
  });
  expect(sent.status()).toBe(201);

  await page.goto(`/chat?channel=${team.id}`);
  const link = page.getByRole('link', { name: address });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', address);

  const box = page.getByPlaceholder(/^Message /);
  await expect(box).toBeVisible();
  const bounds = await box.boundingBox();
  expect(bounds).toBeTruthy();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(640);

  await expect(page.getByRole('contentinfo')).toHaveCount(0);
});
