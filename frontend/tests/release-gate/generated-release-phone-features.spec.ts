import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

test('each phone feature can load its data', async ({ request }) => {
  const signIn = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signIn.ok()).toBeTruthy();
  const session = await signIn.json();
  const headers = { Authorization: `Bearer ${session.token}` };

  const home = await request.get('/api/v1/mobile/home', { headers });
  expect(home.ok()).toBeTruthy();
  const homeBody = await home.json();
  expect(Array.isArray(homeBody.work)).toBeTruthy();
  expect(Array.isArray(homeBody.available)).toBeTruthy();
  expect(Array.isArray(homeBody.directory.constructionGroup)).toBeTruthy();

  const projects = await request.get('/api/v1/mobile/projects', { headers });
  expect(projects.ok()).toBeTruthy();
  expect(Array.isArray((await projects.json()).projects)).toBeTruthy();

  const chat = await request.get('/api/v1/mobile/chat', { headers });
  expect(chat.ok()).toBeTruthy();
  const chatBody = await chat.json();
  expect(Array.isArray(chatBody.channels)).toBeTruthy();
  expect(Array.isArray(chatBody.teammates)).toBeTruthy();

  const notices = await request.get('/api/v1/mobile/announcements', { headers });
  expect(notices.ok()).toBeTruthy();
  expect(Array.isArray((await notices.json()).announcements)).toBeTruthy();

  const processes = await request.get('/api/v1/mobile/processes', { headers });
  expect(processes.ok()).toBeTruthy();
  expect(Array.isArray((await processes.json()).templates)).toBeTruthy();

  const teams = await request.get('/api/v1/mobile/trade-teams', { headers });
  expect(teams.ok()).toBeTruthy();
  expect(Array.isArray((await teams.json()).teams)).toBeTruthy();

  const feedback = await request.get('/api/v1/mobile/feedback', { headers });
  expect(feedback.ok()).toBeTruthy();
  expect(Array.isArray((await feedback.json()).feedback)).toBeTruthy();
});
