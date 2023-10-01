import { Page } from "@playwright/test";

import { select_all } from "../../keyboard-shortcuts";

/**
 * Clears the editor
 * @param page Page
 */
export const clear_editor = async (page: Page): Promise<void> => {
  await select_all(page);
  await page.keyboard.press("Backspace"); // Deletes all nodes
  await page.keyboard.press("Backspace"); // Resets text node style
};
