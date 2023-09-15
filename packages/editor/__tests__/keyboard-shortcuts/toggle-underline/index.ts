import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Toggles underline text style
 * @param page Page
 */
export const toggleUnderline = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press(EDITOR_SHORTCUTS.underline.key);
  await keyUpCtrlOrMeta(page);
};
