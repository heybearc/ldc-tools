import { test, type Page } from '@playwright/test';

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
