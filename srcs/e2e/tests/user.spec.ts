import { type Page, test, expect } from '@playwright/test';

test.describe.serial('User', () => {
  test.skip('should be able to register', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: 'Register here' }).click();

    await page.getByPlaceholder('email').fill('test@example.com');
    await page.getByPlaceholder('username').fill('test');
    await page.getByPlaceholder('•••••••••••••').fill('test');

    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByTitle('Log Out')).toBeVisible();
    await expect(page.getByText('Register')).toBeHidden();
  });

  test.describe.skip('should be able to', () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
    });

    test.afterAll(async () => {
      await page.close();
    });

    test('login', async () => {
      await page.goto('/');

      await page.waitForLoadState('domcontentloaded');

      await page.getByPlaceholder('email').fill('test@example.com');
      await page.getByPlaceholder('•••••••••••••').fill('test');

      await page.getByRole('button', { name: 'Submit' }).click();

      await expect(page.getByTitle('Log Out')).toBeVisible();
      await expect(page.getByText('Login to account')).toBeHidden();
    });

    test('logout', async () => {
      await page.goto('/');

      await page.waitForLoadState('domcontentloaded');
      await page.getByTitle('Log Out').click();

      await expect(page.getByText('Register')).toBeVisible();
    });
  });
});
