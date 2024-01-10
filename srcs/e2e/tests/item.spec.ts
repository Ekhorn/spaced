import { test, expect } from '@playwright/test';

test.describe('Item', () => {
  test('should be created', async ({ context, page }) => {
    await context.addInitScript(() => {
      localStorage.setItem(
        'access_token',
        // Payload = { "exp": "3600" }
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOiIzNjAwIn0.5ATeaSmib2yn61PwR6pLBpkmzuheIC50L5thKpPx0HU',
      );
      localStorage.setItem('refresh_token', 'test');
    });
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Create 🚀' }).click();

    await expect(page.getByText('test')).toBeVisible();
  });
});
