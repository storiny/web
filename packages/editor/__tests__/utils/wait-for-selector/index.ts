import { Frame, Page } from "@playwright/test";

/**
 * Waits for the specified selector on the left iframe to be present in the DOM
 * @param page Page
 * @param selector Element selector
 * @param options Options
 */
export const wait_for_selector = async (
  page: Page,
  selector: string,
  options: Parameters<Frame["waitForSelector"]>[1] = {}
): Promise<void> => {
  await page.frame("left")?.waitForSelector(selector, options);
};
