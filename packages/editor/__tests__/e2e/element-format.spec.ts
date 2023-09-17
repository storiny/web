import { test } from "@playwright/test";

import { editorClassNames } from "../constants/class-names";
import {
  moveLeft,
  moveRight,
  selectCharacters,
  toggleLink
} from "../keyboard-shortcuts";
import { assertHTML, click, focusEditor, html, initialize } from "../utils";

test.describe("element format", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can indent/align paragraph when caret is within a link", async ({
    page
  }) => {
    await page.keyboard.type("Hello https://storiny.com world");
    await moveLeft(page, 6);
    await selectCharacters(page, "left", 19);
    await toggleLink(page);

    // Clear selection and move 5 characters
    await moveLeft(page, 5);
    await moveRight(page, 5);

    await click(page, `[data-testid="indent"]`);
    await click(page, `[data-testid="indent"]`);
    await click(page, `[data-testid="align-center"]`);

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.indent}"
          style="padding-inline-start: calc(64px); text-align: center;"
          dir="ltr"
        >
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
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

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" style="text-align: center">
          <br />
        </p>
      `
    );
  });
});
