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
        // Payload = { "exp": "1607811435" }
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MDc4MTE0MzV9.inQ2hp-MzN4oifBpBVBzJVvU4CEjKO52cKxvdQ7L50k',
      );
      localStorage.setItem('refresh_token', 'test');
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page.getByText('Register')).toBeVisible();
  });
});
