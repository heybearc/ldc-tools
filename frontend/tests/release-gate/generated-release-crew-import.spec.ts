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

function crewCsv(id: string, volunteer: string) {
  return [
    'ID,Your Email,Choose an Action,Your Name,Volunteer Name,Volunteer BA ID (if known),Crew Name,Project Roster Name,Questions or Comments',
    `${id},qa-crew@example.com,Add Volunteer to a Crew,QA Requestor,${volunteer},12345,QA-CREW,QA Roster,release check`,
  ].join('\n');
}

test('a crew-update spreadsheet becomes a claimable task and keeps the requestor', async ({ page }) => {
  await signIn(page);

  let probe = await page.request.get('/api/v1/work-items');
  if (probe.status() === 403) {
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
    probe = await page.request.get('/api/v1/work-items');
  }

  expect(probe.ok()).toBeTruthy();
  const list = await probe.json();
  expect(list.canAssign).toBe(true);

  const stamp = Date.now();
  const volunteer = `QA Volunteer ${stamp}`;
  const csv = crewCsv(String(stamp), volunteer);

  const rejected = await page.request.post('/api/v1/work-items/import', {
    multipart: {
      file: {
        name: 'names.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('NAME,CONGREGATION\nAmber,Twinsburg\n'),
      },
    },
  });
  expect(rejected.status()).toBe(400);

  const imported = await page.request.post('/api/v1/work-items/import', {
    multipart: {
      file: {
        name: 'crew-update.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csv),
      },
    },
  });
  expect(imported.status()).toBe(200);
  const first = await imported.json();
  expect(first.created).toBe(1);

  const again = await page.request.post('/api/v1/work-items/import', {
    multipart: {
      file: {
        name: 'crew-update.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(csv),
      },
    },
  });
  expect(again.ok()).toBeTruthy();
  const second = await again.json();
  expect(second.created).toBe(0);
  expect(second.skipped).toBeGreaterThan(0);

  const after = await page.request.get('/api/v1/work-items');
  expect(after.ok()).toBeTruthy();
  const items = (await after.json()).items as Array<{
    id: string;
    title: string;
    timingLabel: string;
    claimable: boolean;
    status: string;
    requestorName: string | null;
    requestorEmail: string | null;
    detail: string;
  }>;
  const item = items.find((row) => row.title.includes(volunteer));
  expect(item).toBeTruthy();
  expect(item?.timingLabel).toBe('Crew request');
  expect(item?.claimable).toBe(true);
  expect(item?.status).toBe('OPEN');
  expect(item?.requestorName).toBe('QA Requestor');
  expect(item?.requestorEmail).toBe('qa-crew@example.com');
  expect(item?.detail).toContain('QA-CREW');
  expect(item?.detail).toContain('QA Roster');

  await page.goto('/work');
  await expect(page.getByRole('button', { name: 'Import crew requests' })).toBeVisible();
  const row = page.locator('article').filter({ hasText: volunteer });
  await expect(row.getByText('Crew request')).toBeVisible();
  await expect(row.getByText('QA Requestor')).toBeVisible();

  const done = await page.request.patch(`/api/v1/work-items/${item!.id}`, {
    data: { status: 'DONE' },
  });
  expect(done.ok()).toBeTruthy();
  const finished = await done.json();
  expect(finished.status).toBe('DONE');
  expect(finished.requestorEmail).toBe('qa-crew@example.com');
  expect(finished.requestorName).toBe('QA Requestor');
});
