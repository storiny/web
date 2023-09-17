import { Page } from "@playwright/test";

import { click } from "../../utils";

/**
 * Clicks on the outdent button
 * @param page Page
 * @param times Number of times to click
 * @param force Whether to force click
 */
export const clickOutdentButton = async (
  page: Page,
  times = 1,
  force?: boolean
): Promise<void> => {
  for (let i = 0; i < times; i++) {
    await click(page, `[data-testid="outdent"]`, { force });
  }
};
