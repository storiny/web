import { Page } from "@playwright/test";

import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Dispatches the undo command
 * @param page Page
 */
export const undo = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("z");
  await keyUpCtrlOrMeta(page);
};
