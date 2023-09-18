import { Page } from "@playwright/test";

import { selectAll } from "../../keyboard-shortcuts";

/**
 * Clears the editor
 * @param page Page
 */
export const clearEditor = async (page: Page): Promise<void> => {
  await selectAll(page);
  await page.keyboard.press("Backspace"); // Deletes all nodes
  await page.keyboard.press("Backspace"); // Resets text node style
};
