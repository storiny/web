import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { key_down_ctrl_or_meta, key_up_ctrl_or_meta } from "../../utils";

/**
 * Toggles bold text style
 * @param page Page
 */
export const toggle_bold = async (page: Page): Promise<void> => {
  await key_down_ctrl_or_meta(page);
  await page.keyboard.press(EDITOR_SHORTCUTS.bold.key);
  await key_up_ctrl_or_meta(page);
};
