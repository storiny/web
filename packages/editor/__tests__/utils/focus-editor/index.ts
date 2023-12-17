import { Page } from "@playwright/test";

import { sleep } from "../sleep";

/**
 * Focuses the editor
 * @param page Page
 */
export const focus_editor = async (page: Page): Promise<void> => {
  const selector = 'section[contenteditable="true"]';
  await page.waitForSelector('iframe[name="left"]');
  const left_frame = page.frame("left");

  if (!left_frame) {
    return;
  }

  if (left_frame.locator('[data-testid="overlay"]')) {
    await left_frame.waitForSelector('[data-testid="overlay"]', {
      state: "detached"
    });

    await sleep(500);
  }

  await left_frame.focus(selector);
};
