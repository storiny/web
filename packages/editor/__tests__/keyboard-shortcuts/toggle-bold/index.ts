import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Toggles bold text style
 * @param page Page
 */
export const toggleBold = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press(EDITOR_SHORTCUTS.bold.key);
  await keyUpCtrlOrMeta(page);
};
