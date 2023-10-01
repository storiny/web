import { Page } from "@playwright/test";

import { click } from "../click";
import { wait_for_selector } from "../wait-for-selector";

/**
 * Inserts an image into the editor
 * @param page Page
 */
export const insert_image = async (page: Page): Promise<void> => {
  // Open gallery
  await click(page, '[data-testid="insert-image"]');
  await click(page, `button[role="tab"]:text("Library")`);

  // Click the only library image item
  await wait_for_selector(page, `[role="listitem"][data-grid-item]`);
  await click(page, `[role="listitem"][data-grid-item]`);

  // Confirm the image
  await click(page, `button:text("Confirm")`);
  await wait_for_selector(page, `[data-testid="image-node"]`);
};
