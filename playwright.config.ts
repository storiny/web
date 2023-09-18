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
  testMatch: "**/*.spec.[jt]s?(x)",
  testDir: "./packages/editor/__tests__/",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  retries: IS_CI ? 4 : 1,
  timeout: 150000,
  use: {
    navigationTimeout: 30000,
    video: "on-first-retry",
  },
  webServer: {
    command:
      'turbo run multiplayer:test --scope="@storiny/editor" --include-dependencies --no-deps',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
