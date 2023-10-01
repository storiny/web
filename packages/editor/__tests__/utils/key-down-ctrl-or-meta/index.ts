import { Page } from "@playwright/test";

import { is_mac } from "../is-mac";

/**
 * Fires keydown event for the `Meta` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const key_down_ctrl_or_meta = async (page: Page): Promise<void> => {
  if (await is_mac(page)) {
    await page.keyboard.down("Meta");
  } else {
    await page.keyboard.down("Control");
  }
};
