import fs from 'fs';
import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

type OversightAssignment = {
  user?: { name?: string | null; email?: string; image?: string | null };
};

type Crew = { name?: string; oversight?: OversightAssignment[] };

type TradeTeam = {
  name?: string;
  oversight?: OversightAssignment[];
  crews?: Crew[];
};

function peopleIn(teams: TradeTeam[]) {
  const people: OversightAssignment[] = [];
  for (const team of teams) {
    people.push(...(team.oversight || []));
    for (const crew of team.crews || []) {
      people.push(...(crew.oversight || []));
    }
  }
  return people;
}

async function signIn(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15000 });
}

test('directory lists oversight people, role columns, and a CSV export', async ({ page }) => {
  await signIn(page);

  const overviewResponse = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/trade-teams/overview') && response.ok()
  );
  await page.goto('/trade-teams/overview');
  const payload = await (await overviewResponse).json();
  const teams = (payload.tradeTeams || []) as TradeTeam[];
  const people = peopleIn(teams);

  expect(teams.length).toBeGreaterThan(0);
  expect(people.length).toBeGreaterThan(0);

  const firstName = teams[0].name || '';
  expect(firstName.length).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Trade Teams Overview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: firstName, exact: true })).toBeVisible();

  const withPhoto = people.filter((person) => person.user?.image);
  if (withPhoto.length > 0) {
    await expect(page.locator('img.h-7.rounded-full').first()).toBeVisible();
  }

  await page.getByTitle('Table View').click();
  const table = page.getByRole('table');
  await expect(table.getByRole('columnheader', { name: 'TTO', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'TTOA', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'TT Support', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'TCO', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'TCOA', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: 'TC Support', exact: true })).toBeVisible();
  await expect(table.getByRole('cell', { name: firstName }).first()).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  const csvPath = await download.path();
  expect(csvPath).toBeTruthy();
  const csv = fs.readFileSync(csvPath as string, 'utf8');
  expect(csv.split('\n')[0]).toContain('"Trade Team"');
  expect(csv).toContain('"TTO (Overseer)"');
  expect(csv).toContain('"TC Support"');
  expect(csv).toContain(`"${firstName}"`);
});
