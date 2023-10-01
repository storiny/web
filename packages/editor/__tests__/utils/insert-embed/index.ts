import { Page } from "@playwright/test";

import { click } from "../click";
import { wait_for_selector } from "../wait-for-selector";

/**
 * Inserts an embed into the editor
 * @param page Page
 */
export const insert_embed = async (page: Page): Promise<void> => {
  // Open embed modal
  await click(page, '[data-testid="insert-embed"]');
  await wait_for_selector(page, `input[name="url"]`);
  await page
    .frame("left")!
    .locator(`input[name="url"]`)
    .fill("https://example.com");
  // Confirm the embed
  await click(page, `button:text("Confirm")`);
  await wait_for_selector(page, `[data-testid="embed-node"]`);
};
