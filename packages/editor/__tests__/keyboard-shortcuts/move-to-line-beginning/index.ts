import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";
import { key_down_ctrl_or_meta, key_up_ctrl_or_meta, sleep } from "../../utils";

/**
 * Moves to the beginning of the line in the current selection
 * @param page Page
 */
export const move_to_line_beginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await key_down_ctrl_or_meta(page);
    await page.keyboard.press("ArrowLeft");
    await key_up_ctrl_or_meta(page);
  } else {
    await page.keyboard.press("Home");
  }

  await sleep(500);
};
