import { Frame, Page } from "@playwright/test";

/**
 * Clicks on the specified selector present in the left iframe
 * @param page Page
 * @param selector Element selector
 * @param options Options
 */
export const click = async (
  page: Page,
  selector: string,
  options?: Parameters<Frame["click"]>[1]
): Promise<void> => {
  const leftFrame = page.frame("left");
  await leftFrame?.waitForSelector(selector, options);
  await leftFrame?.click(selector, options);
};
