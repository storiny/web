import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  move_left,
  move_right,
  select_characters,
  toggle_link
} from "../keyboard-shortcuts";
import { assert_html, click, focus_editor, html, initialize } from "../utils";

test.describe("element format", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can indent/align paragraph when caret is within a link", async ({
    page
  }) => {
    await page.keyboard.type("Hello https://storiny.com world");
    await move_left(page, 6);
    await select_characters(page, "left", 19);
    await toggle_link(page);

    // Clear selection and move 5 characters
    await move_left(page, 5);
    await move_right(page, 5);

    await click(page, `[data-testid="indent"]`);
    await click(page, `[data-testid="indent"]`);
    await click(page, `[data-testid="align-center"]`);

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.indent}"
          style="padding-inline-start: calc(64px); text-align: center;"
          dir="ltr"
        >
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">https://storiny.com</span>
          </a>
          <span data-lexical-text="true">world</span>
        </p>
      `
    );
  });

  test("can center align an empty paragraph", async ({ page }) => {
    await click(page, `[data-testid="align-center"]`);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" style="text-align: center">
          <br />
        </p>
      `
    );
  });
});
