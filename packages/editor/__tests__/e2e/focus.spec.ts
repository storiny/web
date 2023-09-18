import { expect, test } from "@playwright/test";

import { evaluate, focusEditor, initialize } from "../utils";

test.describe("focus", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("can tab out of the editor", async ({ browserName, page }) => {
    // This won't work in webkit on macOS as tab works differently unless changed in
    // the system preferences.
    test.skip(browserName === "webkit");

    await focusEditor(page);
    await page.keyboard.press("Tab");

    const isEditorFocused = await evaluate(page, () => {
      const editor = document.querySelector('div[contenteditable="true"]');
      return editor === document.activeElement;
    });

    expect(isEditorFocused).toBe(false);
  });
});
