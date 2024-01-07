import { test, expect } from '@playwright/test';

test.describe('Item', () => {
  test('should be created', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    await page.getByPlaceholder('user').fill('test');
    await page.getByPlaceholder('user').press('Enter');

    await page.getByRole('button', { name: 'Create 🚀' }).click();

    await expect(page.getByText('test')).toBeVisible();
  });
});
