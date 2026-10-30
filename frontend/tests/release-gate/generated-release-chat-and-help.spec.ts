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

test('team chat, a help reply, and finishing several tasks', async ({ page }) => {
  await signIn(page);

  const chat = await ensureGroup(page);
  expect(chat.ok()).toBeTruthy();
  const inbox = await chat.json();
  const team = (inbox.channels || []).find((channel: { kind?: string }) => channel.kind === 'TEAM');
  expect(team?.id).toBeTruthy();

  const stamp = Date.now();
  const message = `QA chat ${stamp}`;
  const empty = await page.request.post(`/api/v1/chat/channels/${team.id}/messages`, { data: { body: '   ' } });
  expect(empty.status()).toBe(400);

  const sent = await page.request.post(`/api/v1/chat/channels/${team.id}/messages`, { data: { body: message } });
  expect(sent.status()).toBe(201);
  const posted = await sent.json();
  expect(posted.mine).toBe(true);
  expect(posted.body).toBe(message);

  const listed = await page.request.get(`/api/v1/chat/channels/${team.id}/messages`);
  expect(listed.ok()).toBeTruthy();
  const thread = await listed.json();
  expect((thread.messages || []).some((item: { body?: string }) => item.body === message)).toBe(true);

  await page.goto(`/chat?channel=${team.id}`);
  await expect(page.getByRole('heading', { name: 'Chat', exact: true })).toBeVisible();
  await expect(page.getByText(message)).toBeVisible();

  const titles = [`QA finish A ${stamp}`, `QA finish B ${stamp}`];
  const createdIds: string[] = [];
  for (const title of titles) {
    const created = await page.request.post('/api/v1/work-items', {
      data: { title, detail: 'Release check for finishing several tasks.', timingKind: 'NONE', claimable: false },
    });
    expect(created.status()).toBe(201);
    const item = await created.json();
    createdIds.push(item.id);
  }

  const help = await page.request.post(`/api/v1/work-items/${createdIds[0]}/notes`, {
    data: { kind: 'HELP', body: `QA help ${stamp}` },
  });
  expect(help.status()).toBe(201);
  const helpNote = await help.json();
  expect(helpNote.kind).toBe('HELP');

  const reply = await page.request.post(`/api/v1/work-items/${createdIds[0]}/notes`, {
    data: { kind: 'NOTE', parentId: helpNote.id, body: `QA reply ${stamp}` },
  });
  expect(reply.status()).toBe(201);
  const replyNote = await reply.json();
  expect(replyNote.kind).toBe('NOTE');
  expect(replyNote.body).toBe(`QA reply ${stamp}`);

  const missing = await page.request.post('/api/v1/work-items/complete', { data: { ids: [] } });
  expect(missing.status()).toBe(400);

  const finished = await page.request.post('/api/v1/work-items/complete', { data: { ids: createdIds } });
  expect(finished.ok()).toBeTruthy();
  const result = await finished.json();
  expect(result.completed).toBe(2);

  await page.goto('/my-work');
  await expect(page.getByRole('heading', { name: 'My Work', exact: true })).toBeVisible();
});
