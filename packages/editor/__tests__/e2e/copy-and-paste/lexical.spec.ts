import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES, IS_LINUX } from "../../constants";
import {
  move_to_prev_word,
  select_all,
  toggle_link
} from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  copy_to_clipboard,
  focus_editor,
  html,
  initialize,
  paste_from_clipboard
} from "../../utils";

test.describe("lexical copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can perform basic copy and paste", async ({ page, browserName }) => {
    // Add a paragraph
    await page.keyboard.type("Copy + pasting?");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Sounds good!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Copy + pasting?</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Sounds good!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 12,
      anchor_path: [2, 0, 0],
      focus_offset: 12,
      focus_path: [2, 0, 0]
    });

    // Select all the text
    await select_all(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Copy + pasting?</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Sounds good!</span>
        </p>
      `
    );

    if (browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [],
        focus_offset: 3,
        focus_path: []
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [0, 0, 0],
        focus_offset: 12,
        focus_path: [2, 0, 0]
      });
    }

    // Copy all the text
    const clipboard = await copy_to_clipboard(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Copy + pasting?</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Sounds good!</span>
        </p>
      `
    );

    // Paste after
    await page.keyboard.press("ArrowRight");
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Copy + pasting?</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Sounds good!Copy + pasting?</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Sounds good!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 12,
      anchor_path: [4, 0, 0],
      focus_offset: 12,
      focus_path: [4, 0, 0]
    });
  });

  test("can copy and paste between sections", async ({ page, browserName }) => {
    test.skip(browserName === "firefox");

    await page.keyboard.type("Hello world test");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Next line of text");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world test</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Next line of text</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 17,
      anchor_path: [1, 0, 0],
      focus_offset: 17,
      focus_path: [1, 0, 0]
    });

    // Select all the content
    await select_all(page);

    if (browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [],
        focus_offset: 2,
        focus_path: []
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [0, 0, 0],
        focus_offset: 17,
        focus_path: [1, 0, 0]
      });
    }

    // Copy all the text
    let clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Delete");
    // Paste the content
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world test</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Next line of text</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 17,
      anchor_path: [1, 0, 0],
      focus_offset: 17,
      focus_path: [1, 0, 0]
    });

    await move_to_prev_word(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowUp");
    await move_to_prev_word(page);

    // Once more for linux on Chromium
    if (IS_LINUX && browserName === "chromium") {
      await move_to_prev_word(page);
    }

    await page.keyboard.up("Shift");

    await assert_selection(page, {
      anchor_offset: 13,
      anchor_path: [1, 0, 0],
      focus_offset: 0,
      focus_path: [0, 0, 0]
    });

    // Copy selected text
    clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Delete");
    // Paste the content
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world test</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Next line of text</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 13,
      anchor_path: [1, 0, 0],
      focus_offset: 13,
      focus_path: [1, 0, 0]
    });

    // Select all the content
    await select_all(page);

    if (browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [],
        focus_offset: 2,
        focus_path: []
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [0, 0, 0],
        focus_offset: 17,
        focus_path: [1, 0, 0]
      });
    }

    await page.keyboard.press("Delete");

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });
  });

  test("can copy and paste an inline element into a leaf node", async ({
    page
  }) => {
    // Root
    //   |- Paragraph
    //      |- Link
    //         |- Text "Hello"
    //      |- Text "World"
    await page.keyboard.type("Hello");
    await select_all(page);
    await toggle_link(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.keyboard.type("World");

    await select_all(page);
    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("ArrowRight");
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
          <span data-lexical-text="true">World</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
          <span data-lexical-text="true">World</span>
        </p>
      `
    );
  });

  test("can produces separate paragraphs when pasting multi-line plain text into rich text", async ({
    page
  }) => {
    await page.keyboard.type("# Hello ");
    await paste_from_clipboard(page, {
      "text/plain": "world\nAnd text below"
    });

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">And text below</span>
        </p>
      `
    );
  });
});
