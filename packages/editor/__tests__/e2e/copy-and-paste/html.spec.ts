import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import { move_to_prev_word } from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  click,
  focus_editor,
  html,
  initialize,
  paste_from_clipboard
} from "../../utils";

test.describe("html copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can copy and paste a plain DOM text node", async ({ page }) => {
    const clipboard = { "text/html": "hello" };
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0]
    });
  });

  test("can copy and paste a paragraph element", async ({ page }) => {
    const clipboard = { "text/html": "<p>hello<p>" };
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1],
      focus_offset: 0,
      focus_path: [1]
    });
  });

  test("can copy and paste a paragraph element between horizontal rules", async ({
    page
  }) => {
    let clipboard = { "text/html": "<hr/><hr/>" };
    await paste_from_clipboard(page, clipboard);
    await click(page, "hr:first-of-type");
    // Sets focus between HRs
    await page.keyboard.press("ArrowRight");

    clipboard = { "text/html": "<p>Text between HRs</p>" };
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Text between HRs</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
      `
    );

    await assert_selection(page, {
      anchor_offset: 16,
      anchor_path: [1, 0, 0],
      focus_offset: 16,
      focus_path: [1, 0, 0]
    });
  });

  test("can paste top level element in the middle of paragraph", async ({
    page
  }) => {
    await page.keyboard.type("hello world");
    await move_to_prev_word(page);
    await paste_from_clipboard(page, {
      "text/html": `<hr />`
    });

    await assert_html(
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
