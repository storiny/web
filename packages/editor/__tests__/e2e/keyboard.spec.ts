import { test } from "@playwright/test";

import { E2E_BROWSER, EDITOR_CLASSNAMES, IS_MAC } from "../constants";
import { assert_html, focus_editor, html, initialize } from "../utils";

const SUPPORTS_TRANSPOSE = IS_MAC && E2E_BROWSER !== "firefox";

test.describe("keyboard shortcuts", () => {
  test.beforeEach(({ page }) => SUPPORTS_TRANSPOSE && initialize(page));

  test(`handles "insertTranspose" event from Control+T on Mac`, async ({
    page
  }) => {
    test.skip(!SUPPORTS_TRANSPOSE);

    await focus_editor(page);

    await page.keyboard.type("abc");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.down("Control");
    await page.keyboard.press("T");
    await page.keyboard.press("T");
    await page.keyboard.up("Control");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">bca</span>
        </p>
      `
    );
  });
});
