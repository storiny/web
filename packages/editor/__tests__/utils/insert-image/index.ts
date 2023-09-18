import { Page } from "@playwright/test";

import { click } from "../click";
import { waitForSelector } from "../wait-for-selector";

/**
 * Inserts an image into the editor
 * @param page Page
 */
export const insertImage = async (page: Page): Promise<void> => {
  // Open gallery
  await click(page, '[data-testid="insert-image"]');
  await click(page, `button[role="tab"]:text("Library")`);

  // Click the only library image item
  await waitForSelector(page, `[role="listitem"][data-grid-item]`);
  await click(page, `[role="listitem"][data-grid-item]`);

  // Confirm the image
  await click(page, `button:text("Confirm")`);
  await waitForSelector(page, `[data-testid="image-node"]`);
};
