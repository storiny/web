import { Page } from "@playwright/test";

/**
 * Presses shift + enter keys
 * @param page Page
 */
export const pressShiftEnter = async (page: Page): Promise<void> => {
  await page.keyboard.down("Shift");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Shift");
};
