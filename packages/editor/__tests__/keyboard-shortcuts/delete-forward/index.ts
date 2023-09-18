import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";

/**
 * Deletes text in forward direction
 * @param page Page
 */
export const deleteForward = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.up("Control");
  } else {
    await page.keyboard.press("Delete");
  }
};
