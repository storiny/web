import { Page } from "@playwright/test";

import { key_down_ctrl_or_meta, key_up_ctrl_or_meta } from "../../utils";

/**
 * Fires paste event using keyboard shortcut
 * @param page Page
 */
export const paste = async (page: Page): Promise<void> => {
  await key_down_ctrl_or_meta(page);
  await page.keyboard.press("KeyV");
  await key_up_ctrl_or_meta(page);
};
