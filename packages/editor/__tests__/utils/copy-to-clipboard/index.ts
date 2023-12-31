import { Page } from "@playwright/test";

/**
 * Fires clipboard copy event on the editor
 * @param page Page
 */
export const copy_to_clipboard = async (
  page: Page
): Promise<Record<string, string>> =>
  await page.frame("left")!.evaluate(() => {
    const clipboard_data: Record<string, string> = {};
    const editor = document.querySelector("div[data-editor-content]");
    const copy_event = new ClipboardEvent("copy");

    Object.defineProperty(copy_event, "clipboardData", {
      value: {
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        setData: (type: string, value: string) => {
          clipboard_data[type] = value;
        }
      }
    });

    editor?.dispatchEvent(copy_event);
    return clipboard_data;
  });
