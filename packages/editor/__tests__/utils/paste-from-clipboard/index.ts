import { Page } from "@playwright/test";

import { evaluate } from "../evaluate";

/**
 * Predicate function for determining whether the browser supports the `beforeinput` event
 * @param page Page
 */
export const supportsBeforeInput = (page: Page): Promise<boolean> =>
  evaluate(page, () => {
    if ("InputEvent" in window) {
      return "getTargetRanges" in new window.InputEvent("input");
    }

    return false;
  });

/**
 * Fires clipboard paste event on the editor
 * @param page Page
 * @param clipboardData Clipboard data
 */
export const pasteFromClipboard = async (
  page: Page,
  clipboardData: Record<string, string>
): Promise<void> => {
  const canUseBeforeInput = supportsBeforeInput(page);

  await page.frame("left")!.evaluate(
    async ({
      clipboardData: _clipboardData,
      canUseBeforeInput: _canUseBeforeInput
    }) => {
      const files: File[] = [];

      for (const [clipboardKey, clipboardValue] of Object.entries(
        _clipboardData
      )) {
        if (clipboardKey.startsWith("playwright/base64")) {
          delete _clipboardData[clipboardKey];

          const [base64, type] = clipboardValue;
          const res = await fetch(base64);
          const blob = await res.blob();

          files.push(new File([blob], "file", { type }));
        }
      }

      let eventClipboardData: {
        files: File[];
        getData: (type: string) => string;
        types: string[];
      };

      if (files.length > 0) {
        eventClipboardData = {
          files,
          getData: (type) => _clipboardData[type],
          types: [...Object.keys(_clipboardData), "Files"]
        };
      } else {
        eventClipboardData = {
          files,
          getData: (type) => _clipboardData[type],
          types: Object.keys(_clipboardData)
        };
      }

      const editor = document.querySelector('div[contenteditable="true"]');
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true
      });

      Object.defineProperty(pasteEvent, "clipboardData", {
        value: eventClipboardData
      });

      editor?.dispatchEvent(pasteEvent);

      if (!pasteEvent.defaultPrevented) {
        if (await _canUseBeforeInput) {
          const inputEvent = new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true
          });

          Object.defineProperty(inputEvent, "inputType", {
            value: "insertFromPaste"
          });
          Object.defineProperty(inputEvent, "dataTransfer", {
            value: eventClipboardData
          });

          editor?.dispatchEvent(inputEvent);
        }
      }
    },
    { canUseBeforeInput, clipboardData }
  );
};
