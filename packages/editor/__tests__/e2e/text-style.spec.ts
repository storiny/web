import { expect, test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  move_left,
  move_right,
  move_to_line_beginning,
  move_to_line_end,
  select_characters,
  toggle_bold,
  toggle_code,
  toggle_italic,
  toggle_strikethrough,
  toggle_subscript,
  toggle_superscript,
  toggle_underline
} from "../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  click,
  evaluate,
  focus_editor,
  html,
  initialize
} from "../utils";

test.describe("text style shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can create `bold` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggle_bold(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            world
          </strong>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0]
    });

    await toggle_bold(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `italic` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggle_italic(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            world
          </em>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0]
    });

    await toggle_italic(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `underline` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggle_underline(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_underline}"
            data-lexical-text="true"
          >
            world
          </span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0]
    });

    await toggle_underline(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_underline}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `strikethrough` text using the shortcut", async ({
    page
  }) => {
    await page.keyboard.type("Hello");
    await toggle_strikethrough(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_strikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0]
    });

    await toggle_strikethrough(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_strikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `underline+strikethrough` text using the shortcut", async ({
    page
  }) => {
    await page.keyboard.type("Hello");
    await toggle_underline(page);
    await toggle_strikethrough(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_underline_strikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0]
    });

    await toggle_underline(page);
    await toggle_strikethrough(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_underline_strikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `code` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggle_code(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <code spellcheck="false" data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.inline_code}"> world </span>
          </code>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0, 0]
    });

    await toggle_code(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <code spellcheck="false" data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.inline_code}"> world </span>
          </code>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `subscript` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggle_subscript(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sub data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.t_subscript}"> world </span>
          </sub>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0, 0]
    });

    await toggle_subscript(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sub data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.t_subscript}"> world </span>
          </sub>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can create `superscript` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggle_superscript(page);
    await page.keyboard.type(" world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sup data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.t_superscript}"> world </span>
          </sup>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 6,
      focus_path: [0, 1, 0, 0]
    });

    await toggle_superscript(page);
    await page.keyboard.type("!");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sup data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.t_superscript}"> world </span>
          </sup>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });
});

test.describe("text style shortcuts when a part of text is selected", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);

    await page.keyboard.type("Hello world!");

    await move_left(page);
    await select_characters(page, "left", 5);

    await assert_selection(page, {
      anchor_offset: 11,
      anchor_path: [0, 0, 0],
      focus_offset: 6,
      focus_path: [0, 0, 0]
    });
  });

  test.afterEach(async ({ page }) => {
    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 11,
      anchor_path: [0, 0, 0],
      focus_offset: 6,
      focus_path: [0, 0, 0]
    });
  });

  test("can select text and make it `bold` with the shortcut", async ({
    page
  }) => {
    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0]
    });

    await toggle_bold(page);
  });

  test("can select text and make it `italic` with the shortcut", async ({
    page
  }) => {
    await toggle_italic(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0]
    });

    await toggle_italic(page);
  });

  test("can select text and make it `underline` with the shortcut", async ({
    page
  }) => {
    await toggle_underline(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_underline}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0]
    });

    await toggle_underline(page);
  });

  test("can select text and make it `strikethrough` with the shortcut", async ({
    page
  }) => {
    await toggle_strikethrough(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_strikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0]
    });

    await toggle_strikethrough(page);
  });

  test("can select text and make it `underline+strikethrough` with the shortcut", async ({
    page
  }) => {
    await toggle_underline(page);
    await toggle_strikethrough(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${EDITOR_CLASSNAMES.t_underline_strikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0]
    });

    await toggle_underline(page);
    await toggle_strikethrough(page);
  });

  test("can select text and make it `code` with the shortcut", async ({
    page
  }) => {
    await toggle_code(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <code spellcheck="false" data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.inline_code}"> world </span>
          </code>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0, 0]
    });

    await toggle_code(page);
  });

  test("can select text and make it `subscript` with the shortcut", async ({
    page
  }) => {
    await toggle_subscript(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sub data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.t_subscript}"> world </span>
          </sub>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0, 0]
    });

    await toggle_subscript(page);
  });

  test("can select text and make it `superscript` with the shortcut", async ({
    page
  }) => {
    await toggle_superscript(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sup data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.t_superscript}"> world </span>
          </sup>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0, 0]
    });

    await toggle_superscript(page);
  });
});

test.describe("text style", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("should not format the text in the subsequent paragraph after a triple click selection event", async ({
    page
  }) => {
    await page.keyboard.type("hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("hello world");

    await click(page, 'div[contenteditable="true"] > p', {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      clickCount: 1,
      delay: 100
    });
    await click(page, 'div[contenteditable="true"] > p', {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      clickCount: 2,
      delay: 100
    });
    await click(page, 'div[contenteditable="true"] > p', {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      clickCount: 3,
      delay: 100
    });

    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            hello world
          </strong>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `
    );
  });

  test("can select multiple text parts and format them with shortcuts", async ({
    page
  }) => {
    await page.keyboard.type("Hello world!");
    await move_left(page);
    await select_characters(page, "left", 5);

    await assert_selection(page, {
      anchor_offset: 11,
      anchor_path: [0, 0, 0],
      focus_offset: 6,
      focus_path: [0, 0, 0]
    });

    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0],
      focus_offset: 0,
      focus_path: [0, 1, 0]
    });

    await move_left(page);
    await move_right(page);
    await select_characters(page, "right", 2);

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 1, 0],
      focus_offset: 3,
      focus_path: [0, 1, 0]
    });

    await toggle_italic(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            w
          </strong>
          <strong
            class="${EDITOR_CLASSNAMES.t_bold} ${EDITOR_CLASSNAMES.t_italic}"
            data-lexical-text="true"
          >
            or
          </strong>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            ld
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 2, 0],
      focus_offset: 2,
      focus_path: [0, 2, 0]
    });

    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            w
          </strong>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            or
          </em>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            ld
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 2, 0],
      focus_offset: 2,
      focus_path: [0, 2, 0]
    });

    await move_left(page, 2);
    await select_characters(page, "right", 5);

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 1, 0],
      focus_offset: 2,
      focus_path: [0, 3, 0]
    });

    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello w</span>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            or
          </em>
          <span data-lexical-text="true">ld!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 2, 0]
    });

    await toggle_italic(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 1, 0],
      focus_offset: 5,
      focus_path: [0, 1, 0]
    });

    await toggle_italic(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world!</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 0, 0],
      focus_offset: 11,
      focus_path: [0, 0, 0]
    });
  });

  test("can insert range of formatted text and select part and replace with character", async ({
    page
  }) => {
    await page.keyboard.type("123");

    await toggle_bold(page);

    await page.keyboard.type("456");

    await toggle_bold(page);

    await page.keyboard.type("789");

    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");

    await page.keyboard.type("abc");

    await toggle_bold(page);

    await page.keyboard.type("def");

    await toggle_bold(page);

    await page.keyboard.type("ghi");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">123</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            456
          </strong>
          <span data-lexical-text="true">789</span>
          <br />
          <span data-lexical-text="true">abc</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            def
          </strong>
          <span data-lexical-text="true">ghi</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 3,
      anchor_path: [0, 6, 0],
      focus_offset: 3,
      focus_path: [0, 6, 0]
    });

    await page.keyboard.press("ArrowUp");
    await move_to_line_beginning(page);

    await move_right(page, 2);

    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");

    await move_right(page, 8);

    await page.keyboard.down("Shift");

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 3,
      focus_path: [0, 6, 0]
    });

    await page.keyboard.type("z");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">12z</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 3,
      anchor_path: [0, 0, 0],
      focus_offset: 3,
      focus_path: [0, 0, 0]
    });
  });

  test("can format backwards when the selection is at the first text node boundary", async ({
    page
  }) => {
    await page.keyboard.type("123456");

    await move_left(page, 3);
    await page.keyboard.down("Shift");
    await move_left(page, 3);
    await page.keyboard.up("Shift");
    await toggle_bold(page);

    await move_to_line_end(page);
    await page.keyboard.down("Shift");
    await move_left(page, 4);
    await page.keyboard.up("Shift");
    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            12
          </strong>
          <span data-lexical-text="true">3456</span>
        </p>
      `
    );

    // Toggle once more
    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            123456
          </strong>
        </p>
      `
    );
  });

  test("active states of the text styles toggle buttons syncs with the current selection", async ({
    page
  }) => {
    await page.keyboard.type("A");
    await page.keyboard.press("Enter");
    await page.keyboard.type("B");

    await select_characters(page, "left", 3);

    // Should not be toggled initially
    expect(
      await evaluate(
        page,
        () =>
          // Floating
          !!document.querySelector(
            `[data-testid="floating-bold-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="floating-italic-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="floating-underline-toggle"][data-state="off"]`
          ) &&
          // Sidebar
          !!document.querySelector(
            `[data-testid="bold-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="italic-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="underline-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="strikethrough-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="code-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="superscript-toggle"][data-state="off"]`
          ) &&
          !!document.querySelector(
            `[data-testid="subscript-toggle"][data-state="off"]`
          )
      )
    ).toBeTruthy();

    await toggle_bold(page);
    await toggle_italic(page);
    await toggle_underline(page);
    await toggle_strikethrough(page);
    await toggle_code(page);
    await toggle_subscript(page);
    await toggle_superscript(page);

    expect(
      await evaluate(
        page,
        () =>
          // Floating
          !!document.querySelector(
            `[data-testid="floating-bold-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="floating-italic-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="floating-underline-toggle"][data-state="on"]`
          ) &&
          // Sidebar
          !!document.querySelector(
            `[data-testid="bold-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="italic-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="underline-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="strikethrough-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="code-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="superscript-toggle"][data-state="on"]`
          ) &&
          !!document.querySelector(
            `[data-testid="subscript-toggle"][data-state="on"]`
          )
      )
    ).toBeTruthy();
  });
});
