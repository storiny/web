import { Page } from "@playwright/test";

import { click } from "../click";

/**
 * Inserts a code block node into the editor
 * @param page Page
 */
export const insert_code_block = async (page: Page): Promise<void> => {
  await click(page, '[data-testid="insert-code-block"]');
};
