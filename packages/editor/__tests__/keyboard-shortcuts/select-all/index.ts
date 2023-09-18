import { Page } from "@playwright/test";

import { IS_LINUX } from "../../constants";
import { E2E_BROWSER } from "../../constants";
import { evaluate, keyDownCtrlOrMeta, keyUpCtrlOrMeta } from "../../utils";

/**
 * Selects all the text present in the editor root
 * @param page Page
 */
export const selectAll = async (page: Page): Promise<void> => {
  // TODO: Follow-up https://github.com/facebook/lexical/issues/4665
  if (E2E_BROWSER === "firefox" && IS_LINUX) {
    await evaluate(page, () => {
      const rootElement = document.querySelector('div[contenteditable="true"]');

      if (rootElement) {
        const selection = window.getSelection();
        selection?.setBaseAndExtent(
          rootElement,
          0,
          rootElement,
          rootElement.childNodes.length
        );
      }
    });
  } else {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("a");
    await keyUpCtrlOrMeta(page);
  }
};
