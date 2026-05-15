import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Update this to match your app's title or some text on the landing page
  await expect(page).toHaveTitle(/AgriSync/);
});

test('marketplace link works', async ({ page }) => {
  await page.goto('/');
  const marketplaceLink = page.getByRole('link', { name: /Marketplace/i });
  await marketplaceLink.click();
  await expect(page).toHaveURL(/.*marketplace/);
});
