import { defineConfig, devices } from '@playwright/test';

const { CI, PR_NUMBER } = process.env;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(CI),
  /* Retry on CI only */
  retries: CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: CI
      ? PR_NUMBER
        ? `https://${PR_NUMBER}.review.spaced.fun`
        : `https://staging.spaced.fun`
      : 'http://localhost:1420',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    video: 'on',
  },
  webServer: {
    command: 'npm run dev --prefix ../..',
    reuseExistingServer: true,
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        permissions: ['clipboard-write', 'clipboard-read'],
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    ...(CI
      ? [
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]
      : []),
  ],
});
