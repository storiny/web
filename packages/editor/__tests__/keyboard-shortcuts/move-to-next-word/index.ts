import { Page } from "@playwright/test";

import { keyDownCtrlOrAlt, keyUpCtrlOrAlt } from "../../utils";

/**
 * Moves to the next word in the current selection
 * @param page Page
 */
export const moveToNextWord = async (page: Page): Promise<void> => {
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("ArrowRight");
  await keyUpCtrlOrAlt(page);
};
