import { Page } from "@playwright/test";

import { is_mac } from "../is-mac";

/**
 * Fires keydown event for the `Alt` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const key_down_ctrl_or_alt = async (page: Page): Promise<void> => {
  if (await is_mac(page)) {
    await page.keyboard.down("Alt");
  } else {
    await page.keyboard.down("Control");
  }
};
