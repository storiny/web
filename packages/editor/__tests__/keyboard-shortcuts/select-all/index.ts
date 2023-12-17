import { Page } from "@playwright/test";

import { IS_LINUX } from "../../constants";
import { E2E_BROWSER } from "../../constants";
import {
  evaluate,
  key_down_ctrl_or_meta,
  key_up_ctrl_or_meta
} from "../../utils";

/**
 * Selects all the text present in the editor root
 * @param page Page
 */
export const select_all = async (page: Page): Promise<void> => {
  // TODO: Follow-up https://github.com/facebook/lexical/issues/4665
  if (E2E_BROWSER === "firefox" && IS_LINUX) {
    await evaluate(page, () => {
      const root_element = document.querySelector(
        'section[contenteditable="true"]'
      );

      if (root_element) {
        const selection = window.getSelection();
        selection?.setBaseAndExtent(
          root_element,
          0,
          root_element,
          root_element.childNodes.length
        );
      }
    });
  } else {
    await key_down_ctrl_or_meta(page);
    await page.keyboard.press("a");
    await key_up_ctrl_or_meta(page);
  }
};
