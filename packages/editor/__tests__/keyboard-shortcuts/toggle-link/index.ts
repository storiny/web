import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Toggles link
 * @param page Page
 */
export const toggleLink = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press(EDITOR_SHORTCUTS.link.key);
  await keyUpCtrlOrMeta(page);
};
