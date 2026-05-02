// playwright.config.js
// Demo recording configuration: 1280x800 viewport, video always retained,
// slowMo for visibility, single worker, auto-start the MiniBlog server.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  timeout: 240_000,
  expect: { timeout: 8_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:8080',
    headless: false,
    viewport: { width: 1280, height: 800 },
    video: {
      mode: 'on',
      size: { width: 1280, height: 800 },
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // Slow every action so the cursor and animations are easy to follow.
      slowMo: 120,
    },
  },
  // Auto-start the MiniBlog app via the existing `npm start` script.
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
