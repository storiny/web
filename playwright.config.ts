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
      testDir: "./packages/editor/__tests__/",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "./packages/editor/__tests__/",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "./packages/editor/__tests__/",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  retries: IS_CI ? 4 : 1,
  timeout: 150000,
  use: {
    navigationTimeout: 30000,
    // this causes issues in the CI on on current version.
    //trace: 'retain-on-failure',
    video: "on-first-retry",
  },
  webServer: {
    command: "yarn multiplayer:test",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
