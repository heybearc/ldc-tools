import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

test('the store app lists claimable work and refuses an unknown claim', async ({ request }) => {
  const unsigned = await request.post('/api/v1/mobile/work/not-a-real-task/claim');
  expect(unsigned.status()).toBe(401);

  const signedIn = await request.post('/api/v1/auth/mobile', {
    data: { email: TEST_USER.email, password: TEST_USER.password },
  });
  expect(signedIn.ok()).toBeTruthy();
  const session = await signedIn.json();

  const home = await request.get('/api/v1/mobile/home', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(home.ok()).toBeTruthy();
  const payload = await home.json();

  expect(Array.isArray(payload.available)).toBe(true);
  for (const item of payload.available) {
    expect(typeof item.id).toBe('string');
    expect(typeof item.title).toBe('string');
    expect(typeof item.detail).toBe('string');
    expect(typeof item.timing).toBe('string');
  }

  const sections = [
    payload.directory.constructionGroup,
    payload.directory.personnel,
    payload.directory.ancillary,
    ...payload.directory.teams.flatMap((team: { people: unknown[]; crews: Array<{ people: unknown[] }> }) => [
      team.people,
      ...team.crews.map((crew) => crew.people),
    ]),
  ];
  for (const people of sections) {
    expect(Array.isArray(people)).toBe(true);
    for (const person of people as Array<Record<string, unknown>>) {
      expect(typeof person.name).toBe('string');
      expect(typeof person.role).toBe('string');
      expect(typeof person.place).toBe('string');
      expect('phone' in person).toBe(true);
      expect('photo' in person).toBe(true);
    }
  }

  const missing = await request.post('/api/v1/mobile/work/not-a-real-task/claim', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  expect(missing.status()).toBe(404);

  const photo = await request.get('/api/v1/directory-photos/not-a-photo.jpg');
  expect(photo.status()).toBe(401);
});
