import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta, sleep } from "../../utils";

/**
 * Moves to the end of the line in the current selection
 * @param page Page
 */
export const moveToLineEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowRight");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("End");
  }

  await sleep(500);
};
