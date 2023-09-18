import { Page } from "@playwright/test";
import { nanoid } from "nanoid";

import { E2E_PORT } from "../../constants";

/**
 * Initializes the page for test
 * @param page Page
 */
export const initialize = async (page: Page): Promise<void> => {
  const url = `http://localhost:${E2E_PORT}/split/?collab_id=${nanoid()}`;
  await page.setViewportSize({ height: 1000, width: 3000 });
  await page.goto(url);
};
