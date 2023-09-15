import { Page } from "@playwright/test";

import { keyDownCtrlOrAlt, keyUpCtrlOrAlt } from "../../utils";

/**
 * Deletes the next word in the selection
 * @param page Page
 */
export const deleteNextWord = async (page: Page): Promise<void> => {
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("Delete");
  await keyUpCtrlOrAlt(page);
};
