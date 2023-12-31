import { expect, test } from "@playwright/test";

import { evaluate, focus_editor, initialize } from "../utils";

test.describe("focus", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("can tab out of the editor", async ({ browserName, page }) => {
    // This won't work in webkit on macOS as tab works differently unless
    // changed in the system preferences.
    test.skip(browserName === "webkit");

    await focus_editor(page);
    await page.keyboard.press("Tab");

    const is_editor_focused = await evaluate(page, () => {
      const editor = document.querySelector("div[data-editor-content]");
      return editor === document.activeElement;
    });

    expect(is_editor_focused).toBe(false);
  });
});
