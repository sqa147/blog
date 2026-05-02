// QA suite configuration. Separate from the demo-recording config so that the
// QA tests run headless, in parallel, and with QA-grade diagnostics.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/qa/specs',
  outputDir: './test-results-qa',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-qa' }],
  ],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:8080',
    headless: process.env.PW_HEADED ? false : true,
    // Use the full OS window — `viewport: null` keeps Playwright from forcing
    // a fixed viewport, and --start-maximized maximizes the Chromium window
    // when running headed.
    viewport: null,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      args: ['--start-maximized'],
    },
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      // Plain Chromium without the Desktop Chrome device preset (the preset
      // sets deviceScaleFactor, which conflicts with viewport: null).
      use: { browserName: 'chromium' },
    },
  ],
});
