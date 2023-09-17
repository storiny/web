import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Toggles bulleted list
 * @param page Page
 */
export const toggleBulletedList = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.down("Shift");
  await page.keyboard.press(EDITOR_SHORTCUTS.bulletedList.key);
  await page.keyboard.up("Shift");
  await keyUpCtrlOrMeta(page);
};
