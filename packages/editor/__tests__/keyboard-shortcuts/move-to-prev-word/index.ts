import { Page } from "@playwright/test";

import { keyDownCtrlOrAlt, keyUpCtrlOrAlt } from "../../utils";

/**
 * Moves to the previous word in the current selection
 * @param page Page
 */
export const moveToPrevWord = async (page: Page): Promise<void> => {
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("ArrowLeft");
  await keyUpCtrlOrAlt(page);
};
