import { test, expect } from '@playwright/test';

test.describe('User', () => {
  test('should be able to register', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    await page.getByPlaceholder('email').fill('test@example.com');
    await page.getByPlaceholder('username').fill('test');
    await page.getByPlaceholder('•••••••••••••').fill('test');

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Log out')).toBeVisible();
    await expect(page.getByText('Register')).toBeHidden();
  });

  test('should be able to login', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Login here' }).click();

    await page.getByPlaceholder('email').fill('test@example.com');
    await page.getByPlaceholder('•••••••••••••').fill('test');

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('Log out')).toBeVisible();
    await expect(page.getByText('Login to account')).toBeHidden();
  });

  test('should be able to logout', async ({ context, page }) => {
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

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByText('Register')).toBeVisible();
  });
});
