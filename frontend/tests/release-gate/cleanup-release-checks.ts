import { expect, test, type Page } from '@playwright/test';

export async function revealWork(page: Page, title: string) {
  await page.goto('/work');
  const sizes = page.getByLabel('How many to show');
  const sizeCount = await sizes.count();
  for (let index = 0; index < sizeCount; index += 1) {
    await sizes.nth(index).selectOption('100');
  }
  const heading = page.getByRole('heading', { name: title, exact: true });
  for (let pageTurn = 0; pageTurn < 8; pageTurn += 1) {
    if (await heading.count()) return heading;
    const next = page.getByRole('button', { name: 'Next' });
    const nextCount = await next.count();
    let moved = false;
    for (let index = 0; index < nextCount; index += 1) {
      if (await next.nth(index).isEnabled()) {
        await next.nth(index).click();
        moved = true;
        break;
      }
    }
    if (!moved) break;
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
