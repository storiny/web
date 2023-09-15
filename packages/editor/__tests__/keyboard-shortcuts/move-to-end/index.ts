import { Page } from "@playwright/test";

import { IS_MAC } from "../../utils";

/**
 * Moves to the end of the selection
 * @param page Page
 */
export const moveToEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Meta");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.down("Control");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Control");
  }
};
