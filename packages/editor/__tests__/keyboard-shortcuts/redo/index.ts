import { Page } from "@playwright/test";

import { IS_MAC } from "../../utils";

/**
 * Dispatches the redo command
 * @param page Page
 */
export const redo = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Meta");
    await page.keyboard.down("Shift");
    await page.keyboard.press("z");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.down("Control");
    await page.keyboard.press("y");
    await page.keyboard.up("Control");
  }
};
