import { Page } from "@playwright/test";

import { click } from "../click";

/**
 * Inserts a horizontal rule node into the editor
 * @param page Page
 */
export const insert_horizontal_rule = async (page: Page): Promise<void> => {
  await click(page, '[data-testid="insert-hr"]');
};
