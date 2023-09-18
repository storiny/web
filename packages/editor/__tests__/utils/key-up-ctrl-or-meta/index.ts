import { Page } from "@playwright/test";

import { isMac } from "../is-mac";

/**
 * Fires keyup event for the `Meta` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const keyUpCtrlOrMeta = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.up("Control");
  }
};
