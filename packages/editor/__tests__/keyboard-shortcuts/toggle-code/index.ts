import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Toggles code text style
 * @param page Page
 */
export const toggle_code = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press(EDITOR_SHORTCUTS.code.key);
  await keyUpCtrlOrMeta(page);
};
