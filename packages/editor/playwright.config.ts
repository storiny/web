import { defineConfig, devices } from "@playwright/test";

require("dotenv").config();

const { CI } = process.env;
const IS_CI = CI === "true";

/**
 * Playwright config
 * @see https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  forbidOnly: IS_CI,
  projects: [
    {
      name: "chromium",
      testDir: "./__tests__/",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      testDir: "./__tests__/",
      use: { ...devices["Desktop Firefox"] }
    }
    // TODO: Enable on release (missing deps for Ubuntu 23)
    // {
    //   name: "webkit",
    //   testDir: "./__tests__/",
    //   use: { ...devices["Desktop Safari"] }
    // }
  ],
  retries: IS_CI ? 4 : 1,
  timeout: 150000,
  use: {
    navigationTimeout: 30000,
    // this causes issues in the CI on on current version.
    //trace: 'retain-on-failure',
    video: "on-first-retry"
  },
  webServer: {
    command: "yarn multiplayer:test",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000
  }
});
