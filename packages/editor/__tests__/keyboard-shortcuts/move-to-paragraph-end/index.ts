import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";
import { key_down_ctrl_or_alt, key_up_ctrl_or_alt, sleep } from "../../utils";

/**
 * Moves to the end of the paragraph in the current selection
 * @param page Page
 */
export const move_to_paragraph_end = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await key_down_ctrl_or_alt(page);
    await page.keyboard.press("ArrowDown");
    await key_up_ctrl_or_alt(page);
  } else {
    await page.keyboard.press("End");
  }

  await sleep(500);
};
