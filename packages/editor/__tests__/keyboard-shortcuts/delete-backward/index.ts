import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";

/**
 * Deletes text in backward direction
 * @param page Page
 */
export const delete_backward = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Control");
    await page.keyboard.press("h");
    await page.keyboard.up("Control");
  } else {
    await page.keyboard.press("Backspace");
  }
};
