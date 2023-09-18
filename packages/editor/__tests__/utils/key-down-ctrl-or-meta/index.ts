import { Page } from "@playwright/test";

import { isMac } from "../is-mac";

/**
 * Fires keydown event for the `Meta` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const keyDownCtrlOrMeta = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.down("Meta");
  } else {
    await page.keyboard.down("Control");
  }
};
