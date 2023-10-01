import { Frame, Page } from "@playwright/test";

/**
 * Returns the text content of the specified selector present in the left iframe
 * @param page Page
 * @param selector Element selector
 * @param options Options
 */
export const text_content = async (
  page: Page,
  selector: string,
  options?: Parameters<Frame["textContent"]>[1]
): Promise<string | null | undefined> =>
  await page.frame("left")?.textContent(selector, options);
