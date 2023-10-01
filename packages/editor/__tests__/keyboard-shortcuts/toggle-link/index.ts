import { Page } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { key_down_ctrl_or_meta, key_up_ctrl_or_meta } from "../../utils";

/**
 * Toggles link
 * @param page Page
 */
export const toggle_link = async (page: Page): Promise<void> => {
  await key_down_ctrl_or_meta(page);
  await page.keyboard.press(EDITOR_SHORTCUTS.link.key);
  await key_up_ctrl_or_meta(page);
};
