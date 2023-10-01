import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  extend_to_next_word,
  move_left,
  move_to_editor_beginning,
  move_to_editor_end,
  move_to_line_beginning,
  move_to_next_word,
  press_backspace,
  select_all,
  toggle_link
} from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  click,
  copy_to_clipboard,
  focus_editor,
  html,
  initialize,
  paste_from_clipboard,
  sleep
} from "../../utils";

test.describe("html link copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can copy and paste an anchor element", async ({ page }) => {
    const clipboard = {
      "text/html": '<a href="https://storiny.com">storiny</a>'
    };
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <a
            href="https://storiny.com"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">storiny</span>
          </a>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 7,
      anchor_path: [0, 0, 0, 0],
      focus_offset: 7,
      focus_path: [0, 0, 0, 0]
    });

    await select_all(page);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true">storiny</span>
        </p>
      `
    );

    await toggle_link(page);
    await click(page, `button[title="Edit link"]`);
    await press_backspace(page); // Remove `/` from the input
    await page.keyboard.type("https://storiny.com");
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">storiny</span>
          </a>
        </p>
      `
    );
  });

  test("can copy and paste in front of or after a link", async ({ page }) => {
    await paste_from_clipboard(page, {
      "text/html": `text <a href="https://storiny.com">link</a> text`
    });
    await move_to_editor_beginning(page);
    await paste_from_clipboard(page, {
      "text/html": "before"
    });
    await move_to_editor_end(page);
    await paste_from_clipboard(page, {
      "text/html": "after"
    });

    await sleep(500);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">beforetext </span>
          <a
            href="https://storiny.com"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">link</span>
          </a>
          <span data-lexical-text="true"> textafter</span>
        </p>
      `
    );
  });

  test("can copy and paste a link by selecting its (partial) content", async ({
    page,
    browserName
  }) => {
    test.skip(browserName === "firefox");

    await paste_from_clipboard(page, {
      "text/html": `text <a href="https://storiny.com">link</a> text`
    });
    await move_left(page, 5);
    await page.keyboard.down("Shift");
    await move_left(page, 2);
    await page.keyboard.up("Shift");

    const clipboard = await copy_to_clipboard(page);
    await move_to_editor_end(page);
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">text </span>
          <a
            href="https://storiny.com"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">link</span>
          </a>
          <span data-lexical-text="true"> text</span>
          <a
            href="https://storiny.com"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">nk</span>
          </a>
        </p>
      `
    );
  });

  test("can paste a link into text", async ({ page }) => {
    await page.keyboard.type("hello world");
    await page.pause();
    await move_to_line_beginning(page);
    await move_to_next_word(page);
    await extend_to_next_word(page);

    const clipboard = {
      text: `https://storiny.com`
    };
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );
  });
});
