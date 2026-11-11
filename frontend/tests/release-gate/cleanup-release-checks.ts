import { expect, test, type Page } from '@playwright/test';

export async function revealWork(page: Page, title: string) {
  await page.goto('/work');
  const open = page.locator('section').filter({ has: page.getByRole('button', { name: 'Select all' }) });
  const sizes = open.getByLabel('How many to show');
  if (await sizes.count()) await sizes.first().selectOption('100');
  const heading = open.getByRole('heading', { name: title, exact: true });
  for (let pageTurn = 0; pageTurn < 8; pageTurn += 1) {
    if (await heading.count()) break;
    const next = open.getByRole('button', { name: 'Next' });
    if (!(await next.count()) || !(await next.first().isEnabled())) break;
    await next.first().click();
  }
  await expect(heading).toBeVisible();
  return heading;
}

export async function removeReleaseChecks(page: Page) {
  const response = await page.request.delete('/api/v1/work-items/release-checks');
  if (response.status() === 401 || response.status() === 403) return;
  if (!response.ok()) {
    throw new Error(`Could not remove release check data (${response.status()})`);
  }
}

test.afterEach(async ({ page }) => {
  await removeReleaseChecks(page);
});
