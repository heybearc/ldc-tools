import { test, expect } from '@playwright/test';

test('the sign-in logo loads for a signed-out visitor', async ({ page }) => {
  await page.goto('/auth/signin');
  const logo = page.locator('img[alt="LDC Tools"]');
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute('src', '/logo.svg');

  const loaded = await logo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
  expect(loaded).toBe(true);

  const asset = await page.request.get('/logo.svg');
  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type'] || '').toContain('image/svg');
  expect(await asset.text()).toContain('<svg');

  const home = await page.request.get('/', { maxRedirects: 0 });
  expect(home.status()).toBeGreaterThanOrEqual(300);
  expect(home.status()).toBeLessThan(400);
  expect(home.headers().location || '').toContain('/auth/signin');
});
