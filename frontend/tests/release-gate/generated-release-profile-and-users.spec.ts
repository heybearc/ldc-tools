import { test, expect, type Page } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@test.com',
  password: process.env.TEST_USER_PASSWORD || 'admin123',
};

type DirectoryPerson = {
  user?: { name?: string | null; email?: string };
};

type DirectoryColumns = {
  contact?: DirectoryPerson[];
  assistant?: DirectoryPerson[];
  support?: DirectoryPerson[];
};

function personName(person: DirectoryPerson) {
  const user = person.user;
  if (!user) return '';
  return user.name || (user.email ? user.email.split('@')[0] : '');
}

function firstNamed(columns: DirectoryColumns | undefined) {
  const people = [
    ...(columns?.contact || []),
    ...(columns?.assistant || []),
    ...(columns?.support || []),
  ];
  return people.map(personName).find((name) => name.length > 0) || '';
}

async function signIn(page: Page) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith('/auth/signin'), { timeout: 15000 });
}

test('a Personnel directory name opens that profile without a trade or crew', async ({ page }) => {
  await signIn(page);

  const overviewResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/trade-teams/overview') && response.ok()
  );
  await page.goto('/trade-teams/overview');
  const payload = await (await overviewResponse).json();
  const name = firstNamed(payload.directoryGroups?.personnel);
  expect(name.length).toBeGreaterThan(0);

  const personnel = page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Personnel', exact: true }),
  });
  await personnel.getByRole('button', { name, exact: true }).first().click();

  const profile = page.locator('.fixed').filter({
    has: page.getByRole('heading', { name: 'Profile', exact: true }),
  });
  await expect(profile.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible();
  await expect(profile.getByText('Trade', { exact: true })).toHaveCount(0);
  await expect(profile.getByText('Crew', { exact: true })).toHaveCount(0);
  await expect(profile.getByText('First name', { exact: true })).toBeVisible();
  await profile.getByRole('button', { name: 'Cancel' }).click();
  await expect(profile).toHaveCount(0);
});

test('an admin can type a user name and email, and can cancel an invitation', async ({ page }) => {
  await signIn(page);

  const usersResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/admin/users') && !response.url().includes('/stats') && response.ok()
  );
  const statsResponse = page.waitForResponse(
    (response) => response.url().includes('/api/v1/admin/users/stats') && response.ok()
  );
  await page.goto('/admin/users');
  const usersPayload = await (await usersResponse).json();
  const statsPayload = await (await statsResponse).json();
  const users = (usersPayload.users || []) as { name: string; email: string; status: string }[];
  const inactive = statsPayload.stats?.inactive;
  expect(users.length).toBeGreaterThan(0);
  expect(typeof inactive).toBe('number');

  await expect(page.getByRole('definition').nth(3)).toHaveText(String(inactive));

  const person = users.find((user) => user.name && user.email) || users[0];
  const row = page.locator('tr').filter({ hasText: person.email });
  await row.getByTitle('Edit user').click();

  const editor = page.locator('.fixed').filter({ hasText: 'Full Name' });
  const nameInput = editor.locator('input[type="text"]');
  const emailInput = editor.locator('input[type="email"]');
  await expect(nameInput).toHaveValue(person.name);
  await expect(emailInput).toHaveValue(person.email);

  const typedName = `${person.name} Edit`;
  const typedEmail = `edit.${person.email}`;
  await nameInput.fill(typedName);
  await emailInput.fill(typedEmail);
  await expect(nameInput).toHaveValue(typedName);
  await expect(emailInput).toHaveValue(typedEmail);
  await expect(editor.getByRole('heading', { name: `Edit User: ${typedName}` })).toBeVisible();
  await editor.getByRole('button', { name: 'Cancel' }).click();
  await expect(editor).toHaveCount(0);
  await expect(row).toContainText(person.name);

  const invited = users.find((user) => user.status === 'INVITED');
  if (invited) {
    page.once('dialog', (dialog) => {
      expect(dialog.message()).toContain('Cancel this invitation?');
      dialog.dismiss();
    });
    const invitedRow = page.locator('tr').filter({ hasText: invited.email });
    await invitedRow.getByTitle('More actions').click();
    await page.getByRole('button', { name: 'Cancel Invitation' }).click();
    await expect(invitedRow).toContainText('INVITED');
    return;
  }

  const active = users.find((user) => user.status === 'ACTIVE') || person;
  const activeRow = page.locator('tr').filter({ hasText: active.email });
  await activeRow.getByTitle('More actions').click();
  await expect(page.getByRole('button', { name: 'Cancel Invitation' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Resend Invitation' })).toHaveCount(0);
});
