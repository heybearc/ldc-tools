import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

test('a phone can register for alerts and open processes and trade teams', async ({ request }) => {
  const signedIn = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signedIn.ok()).toBeTruthy();
  const session = await signedIn.json();
  const headers = { Authorization: `Bearer ${session.token}` };

  const bad = await request.post('/api/v1/mobile/push', {
    headers,
    data: { token: 'not-a-phone-token' },
  });
  expect(bad.status()).toBe(400);

  const token = `ExponentPushToken[release${Date.now()}]`;
  const saved = await request.post('/api/v1/mobile/push', {
    headers,
    data: { token },
  });
  expect(saved.ok()).toBeTruthy();
  expect(await saved.json()).toEqual({ ok: true });

  const removed = await request.delete(`/api/v1/mobile/push?token=${encodeURIComponent(token)}`, {
    headers,
  });
  expect(removed.ok()).toBeTruthy();

  const processes = await request.get('/api/v1/mobile/processes', { headers });
  expect(processes.ok()).toBeTruthy();
  const processBody = await processes.json();
  expect(typeof processBody.canManage).toBe('boolean');
  expect(Array.isArray(processBody.templates)).toBe(true);
  expect(Array.isArray(processBody.projects)).toBe(true);

  const teams = await request.get('/api/v1/mobile/trade-teams', { headers });
  expect(teams.ok()).toBeTruthy();
  const teamBody = await teams.json();
  expect(typeof teamBody.canManage).toBe('boolean');
  expect(Array.isArray(teamBody.teams)).toBe(true);
});
