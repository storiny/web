import { Page } from "@playwright/test";

/**
 * Fires clipboard copy event on the editor
 * @param page Page
 */
export const copy_to_clipboard = async (
  page: Page
): Promise<Record<string, string>> =>
  await page.frame("left")!.evaluate(() => {
    const clipboardData: Record<string, string> = {};
    const editor = document.querySelector('div[contenteditable="true"]');
    const copyEvent = new ClipboardEvent("copy");

    Object.defineProperty(copyEvent, "clipboardData", {
      value: {
        setData: (type: string, value: string) => {
          clipboardData[type] = value;
        }
      }
    });

    editor?.dispatchEvent(copyEvent);
    return clipboardData;
  });
