import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import { moveToPrevWord } from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  click,
  focusEditor,
  html,
  initialize,
  pasteFromClipboard
} from "../../utils";

test.describe("html copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can copy and paste a plain DOM text node", async ({ page }) => {
    const clipboard = { "text/html": "hello" };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0]
    });
  });

  test("can copy and paste a paragraph element", async ({ page }) => {
    const clipboard = { "text/html": "<p>hello<p>" };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1],
      focusOffset: 0,
      focusPath: [1]
    });
  });

  test("can copy and paste a paragraph element between horizontal rules", async ({
    page
  }) => {
    let clipboard = { "text/html": "<hr/><hr/>" };
    await pasteFromClipboard(page, clipboard);
    await click(page, "hr:first-of-type");
    // Sets focus between HRs
    await page.keyboard.press("ArrowRight");

    clipboard = { "text/html": "<p>Text between HRs</p>" };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Text between HRs</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
      `
    );

    await assertSelection(page, {
      anchorOffset: 16,
      anchorPath: [2, 0, 0],
      focusOffset: 16,
      focusPath: [2, 0, 0]
    });
  });

  test("can paste top level element in the middle of paragraph", async ({
    page
  }) => {
    await page.keyboard.type("hello world");
    await moveToPrevWord(page);
    await pasteFromClipboard(page, {
      "text/html": `<hr />`
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">world</span>
        </p>
      `
    );
  });
});
