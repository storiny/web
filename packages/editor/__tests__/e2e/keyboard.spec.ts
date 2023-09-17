import { test } from "@playwright/test";

import { editorClassNames } from "../constants/class-names";
import {
  assertHTML,
  E2E_BROWSER,
  focusEditor,
  html,
  initialize,
  IS_MAC
} from "../utils";

const SUPPORTS_TRANSPOSE = IS_MAC && E2E_BROWSER !== "firefox";

test.describe("keyboard shortcuts", () => {
  test.beforeEach(({ page }) => SUPPORTS_TRANSPOSE && initialize(page));

  test(`handles "insertTranspose" event from Control+T on Mac`, async ({
    page
  }) => {
    test.skip(!SUPPORTS_TRANSPOSE);

    await focusEditor(page);

    await page.keyboard.type("abc");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.down("Control");
    await page.keyboard.press("T");
    await page.keyboard.press("T");
    await page.keyboard.up("Control");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">bca</span>
        </p>
      `
    );
  });
});
