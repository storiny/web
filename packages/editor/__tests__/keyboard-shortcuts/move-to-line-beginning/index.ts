import { Page } from "@playwright/test";

import { IS_MAC } from "../../constants";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta, sleep } from "../../utils";

/**
 * Moves to the beginning of the line in the current selection
 * @param page Page
 */
export const moveToLineBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowLeft");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("Home");
  }

  await sleep(500);
};
