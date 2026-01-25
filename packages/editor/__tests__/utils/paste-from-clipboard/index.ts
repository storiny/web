import { Page } from "@playwright/test";

import { evaluate } from "../evaluate";

/**
 * Predicate function for determining whether the browser supports the `beforeinput` event
 * @param page Page
 */
export const supports_before_input = (page: Page): Promise<boolean> =>
  evaluate(page, () => {
    if ("InputEvent" in window) {
      return "getTargetRanges" in new window.InputEvent("input");
    }

    return false;
  });

/**
 * Fires clipboard paste event on the editor
 * @param page Page
 * @param clipboard_data Clipboard data
 */
export const paste_from_clipboard = async (
  page: Page,
  clipboard_data: Record<string, string>
): Promise<void> => {
  const can_use_before_input = supports_before_input(page);

  await page.frame("left")!.evaluate(
    async ({
      clipboard_data: _clipboard_data,
      can_use_before_input: _can_use_before_input
    }) => {
      const files: File[] = [];

      for (const [clipboard_key, clipboard_value] of Object.entries(
        _clipboard_data
      )) {
        if (clipboard_key.startsWith("playwright/base64")) {
          delete _clipboard_data[clipboard_key];

          const [base64, type] = clipboard_value;
          const res = await fetch(base64);
          const blob = await res.blob();

          files.push(new File([blob], "file", { type }));
        }
      }

      let event_clipboard_data: {
        files: File[];

        getData: (type: string) => string;
        types: string[];
      };

      if (files.length > 0) {
        event_clipboard_data = {
          files,

          getData: (type) => _clipboard_data[type],
          types: [...Object.keys(_clipboard_data), "Files"]
        };
      } else {
        event_clipboard_data = {
          files,

          getData: (type) => _clipboard_data[type],
          types: Object.keys(_clipboard_data)
        };
      }

      const editor = document.querySelector("div[data-editor-content]");
      const paste_event = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true
      });

      Object.defineProperty(paste_event, "clipboardData", {
        value: event_clipboard_data
      });

      editor?.dispatchEvent(paste_event);

      if (!paste_event.defaultPrevented) {
        if (await _can_use_before_input) {
          const input_event = new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true
          });

          Object.defineProperty(input_event, "inputType", {
            value: "insertFromPaste"
          });
          Object.defineProperty(input_event, "dataTransfer", {
            value: event_clipboard_data
          });

          editor?.dispatchEvent(input_event);
        }
      }
    },
    { can_use_before_input, clipboard_data }
  );
};
