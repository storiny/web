import { Page } from "@playwright/test";

import { evaluate } from "../evaluate";

/**
 * Predicate function for determining Mac
 * @param page Page
 */
export const isMac = async (page: Page): Promise<boolean> =>
  evaluate(
    page,
    () =>
      typeof window !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
  );
