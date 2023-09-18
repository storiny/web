import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";
import { keyDownCtrlOrAlt, keyUpCtrlOrAlt, sleep } from "../../utils";

/**
 * Moves to the beginning of the paragraph in the current selection
 * @param page Page
 */
export const moveToParagraphBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrAlt(page);
    await page.keyboard.press("ArrowUp");
    await keyUpCtrlOrAlt(page);
  } else {
    await page.keyboard.press("Home");
  }

  await sleep(500);
};
