import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Toggles strikethrough text style
 * @param page Page
 */
export const toggle_strikethrough = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.down("Shift");
  await page.keyboard.press(EDITOR_SHORTCUTS.strikethrough.key);
  await page.keyboard.up("Shift");
  await keyUpCtrlOrMeta(page);
};
