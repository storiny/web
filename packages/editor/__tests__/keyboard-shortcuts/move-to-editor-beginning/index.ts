import { Page } from "@playwright/test";

import { E2E_BROWSER, IS_MAC } from "../../constants";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta, sleep } from "../../utils";

/**
 * Moves to the beginning of the editor root
 * @param page Page
 */
export const moveToEditorBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowUp");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("PageUp");

    if (E2E_BROWSER === "firefox") {
      await page.keyboard.press("Home");
    }
  }

  await sleep(500);
};
