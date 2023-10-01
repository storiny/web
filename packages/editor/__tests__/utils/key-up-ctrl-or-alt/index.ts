import { Page } from "@playwright/test";

import { is_mac } from "../is-mac";

/**
 * Fires keyup event for the `Alt` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const key_up_ctrl_or_alt = async (page: Page): Promise<void> => {
  if (await is_mac(page)) {
    await page.keyboard.up("Alt");
  } else {
    await page.keyboard.up("Control");
  }
};
