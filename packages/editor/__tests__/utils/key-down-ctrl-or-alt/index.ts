import { Page } from "@playwright/test";

import { isMac } from "../is-mac";

/**
 * Fires keydown event for the `Alt` key on Mac or `Control` key on other platforms
 * @param page Page
 */
export const keyDownCtrlOrAlt = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.down("Alt");
  } else {
    await page.keyboard.down("Control");
  }
};
