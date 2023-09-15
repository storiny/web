import { Page } from "@playwright/test";

import { IS_MAC, keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Moves to the beginning of the line in the current selection
 * @param page Page
 */
export const moveToLineBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowLeft");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("Home");
  }
};
