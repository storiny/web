import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";
import { keyDownCtrlOrAlt, keyUpCtrlOrMeta, sleep } from "../../utils";

/**
 * Moves to the end of the paragraph in the current selection
 * @param page Page
 */
export const moveToParagraphEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrAlt(page);
    await page.keyboard.press("ArrowDown");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("End");
  }

  await sleep(500);
};
