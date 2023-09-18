import { Page } from "@playwright/test";

import { sleep } from "../sleep";

/**
 * Focuses the editor
 * @param page Page
 */
export const focusEditor = async (page: Page): Promise<void> => {
  const selector = 'div[contenteditable="true"]';
  await page.waitForSelector('iframe[name="left"]');
  const leftFrame = page.frame("left");

  if (!leftFrame) {
    return;
  }

  if (leftFrame.locator('[data-testid="overlay"]')) {
    await leftFrame.waitForSelector('[data-testid="overlay"]', {
      state: "detached"
    });

    await sleep(500);
  }

  await leftFrame.focus(selector);
};
