import { Page } from "@playwright/test";

import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Fires paste event using keyboard shortcut
 * @param page Page
 */
export const paste = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("KeyV");
  await keyUpCtrlOrMeta(page);
};
