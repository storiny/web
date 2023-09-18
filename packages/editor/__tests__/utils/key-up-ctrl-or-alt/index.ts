import { Page } from "@playwright/test";

import { isMac } from "../is-mac";

/**
 * Fires keyup event for the `Alt` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const keyUpCtrlOrAlt = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.up("Alt");
  } else {
    await page.keyboard.up("Control");
  }
};
