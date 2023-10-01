import { Page } from "@playwright/test";

import { E2E_BROWSER, IS_MAC } from "../../constants";
import { key_down_ctrl_or_meta, key_up_ctrl_or_meta, sleep } from "../../utils";

/**
 * Moves to the beginning of the editor root
 * @param page Page
 */
export const move_to_editor_beginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await key_down_ctrl_or_meta(page);
    await page.keyboard.press("ArrowUp");
    await key_up_ctrl_or_meta(page);
  } else {
    await page.keyboard.press("PageUp");

    if (E2E_BROWSER === "firefox") {
      await page.keyboard.press("Home");
    }
  }

  await sleep(500);
};
