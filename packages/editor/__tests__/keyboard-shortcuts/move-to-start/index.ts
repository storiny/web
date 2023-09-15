import { Page } from "@playwright/test";

import { IS_MAC } from "../../utils";

/**
 * Moves to the start of the selection
 * @param page Page
 */
export const moveToStart = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Meta");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.down("Control");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("Control");
  }
};
