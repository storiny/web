import { Page } from "@playwright/test";

import { select_all, toggle_link } from "../../keyboard-shortcuts";
import { click } from "../click";

/**
 * Sets the URL of a link node or converts the text selection into a link
 * @param page Page
 * @param url URL string
 */
export const set_url = async (page: Page, url: string): Promise<void> => {
  if (await page.frame("left")?.isVisible(`button[title="Edit link"]`)) {
    await click(page, `button[title="Edit link"]`);
  } else {
    await toggle_link(page);
  }

  await select_all(page);
  await page.keyboard.type(url);
  await page.keyboard.press("Enter");
};
