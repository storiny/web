import { Page } from "@playwright/test";

import { keyDownCtrlOrAlt, keyUpCtrlOrAlt } from "../../utils";

/**
 * Extends the selection to the next word in the current selection
 * @param page Page
 */
export const extendToNextWord = async (page: Page): Promise<void> => {
  await page.keyboard.down("Shift");
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("ArrowRight");
  await keyUpCtrlOrAlt(page);
  await page.keyboard.up("Shift");
};
