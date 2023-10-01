import { Page } from "@playwright/test";

import { click } from "../../utils";

/**
 * Clicks on the indent button
 * @param page Page
 * @param times Number of times to click
 * @param force Whether to force click
 */
export const click_indent_button = async (
  page: Page,
  times = 1,
  force?: boolean
): Promise<void> => {
  for (let i = 0; i < times; i++) {
    await click(page, `[data-testid="indent"]`, { force });
  }
};
