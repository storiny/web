import { Page } from "@playwright/test";

import { key_down_ctrl_or_alt, key_up_ctrl_or_alt } from "../../utils";

/**
 * Moves to the next word in the current selection
 * @param page Page
 */
export const move_to_next_word = async (page: Page): Promise<void> => {
  await key_down_ctrl_or_alt(page);
  await page.keyboard.press("ArrowRight");
  await key_up_ctrl_or_alt(page);
};
