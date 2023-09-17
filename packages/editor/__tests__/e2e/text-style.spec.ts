import { expect, test } from "@playwright/test";

import { editorClassNames } from "../constants/class-names";
import {
  moveLeft,
  moveRight,
  moveToLineBeginning,
  moveToLineEnd,
  selectCharacters,
  toggleBold,
  toggleCode,
  toggleItalic,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
  toggleUnderline
} from "../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  click,
  evaluate,
  focusEditor,
  html,
  initialize
} from "../utils";

test.describe("text style shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can create `bold` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggleBold(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            world
          </strong>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0]
    });

    await toggleBold(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `italic` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggleItalic(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            world
          </em>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0]
    });

    await toggleItalic(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `underline` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggleUnderline(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span class="${editorClassNames.tUnderline}" data-lexical-text="true">
            world
          </span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0]
    });

    await toggleUnderline(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span class="${editorClassNames.tUnderline}" data-lexical-text="true">
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `strikethrough` text using the shortcut", async ({
    page
  }) => {
    await page.keyboard.type("Hello");
    await toggleStrikethrough(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0]
    });

    await toggleStrikethrough(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `underline+strikethrough` text using the shortcut", async ({
    page
  }) => {
    await page.keyboard.type("Hello");
    await toggleUnderline(page);
    await toggleStrikethrough(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${editorClassNames.tUnderlineStrikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0]
    });

    await toggleUnderline(page);
    await toggleStrikethrough(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${editorClassNames.tUnderlineStrikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `code` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggleCode(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <code spellcheck="false" data-lexical-text="true">
            <span class="${editorClassNames.inlineCode}"> world </span>
          </code>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0, 0]
    });

    await toggleCode(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <code spellcheck="false" data-lexical-text="true">
            <span class="${editorClassNames.inlineCode}"> world </span>
          </code>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `subscript` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggleSubscript(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sub data-lexical-text="true">
            <span class="${editorClassNames.tSubscript}"> world </span>
          </sub>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0, 0]
    });

    await toggleSubscript(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sub data-lexical-text="true">
            <span class="${editorClassNames.tSubscript}"> world </span>
          </sub>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });

  test("can create `superscript` text using the shortcut", async ({ page }) => {
    await page.keyboard.type("Hello");
    await toggleSuperscript(page);
    await page.keyboard.type(" world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sup data-lexical-text="true">
            <span class="${editorClassNames.tSuperscript}"> world </span>
          </sup>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 6,
      focusPath: [0, 1, 0, 0]
    });

    await toggleSuperscript(page);
    await page.keyboard.type("!");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sup data-lexical-text="true">
            <span class="${editorClassNames.tSuperscript}"> world </span>
          </sup>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 2, 0],
      focusOffset: 1,
      focusPath: [0, 2, 0]
    });
  });
});

test.describe("text style shortcuts when a part of text is selected", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);

    await page.keyboard.type("Hello world!");

    await moveLeft(page);
    await selectCharacters(page, "left", 5);

    await assertSelection(page, {
      anchorOffset: 11,
      anchorPath: [0, 0, 0],
      focusOffset: 6,
      focusPath: [0, 0, 0]
    });
  });

  test.afterEach(async ({ page }) => {
    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 11,
      anchorPath: [0, 0, 0],
      focusOffset: 6,
      focusPath: [0, 0, 0]
    });
  });

  test("can select text and make it `bold` with the shortcut", async ({
    page
  }) => {
    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0]
    });

    await toggleBold(page);
  });

  test("can select text and make it `italic` with the shortcut", async ({
    page
  }) => {
    await toggleItalic(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0]
    });

    await toggleItalic(page);
  });

  test("can select text and make it `underline` with the shortcut", async ({
    page
  }) => {
    await toggleUnderline(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span class="${editorClassNames.tUnderline}" data-lexical-text="true">
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0]
    });

    await toggleUnderline(page);
  });

  test("can select text and make it `strikethrough` with the shortcut", async ({
    page
  }) => {
    await toggleStrikethrough(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0]
    });

    await toggleStrikethrough(page);
  });

  test("can select text and make it `underline+strikethrough` with the shortcut", async ({
    page
  }) => {
    await toggleUnderline(page);
    await toggleStrikethrough(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <span
            class="${editorClassNames.tUnderlineStrikethrough}"
            data-lexical-text="true"
          >
            world
          </span>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0]
    });

    await toggleUnderline(page);
    await toggleStrikethrough(page);
  });

  test("can select text and make it `code` with the shortcut", async ({
    page
  }) => {
    await toggleCode(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <code spellcheck="false" data-lexical-text="true">
            <span class="${editorClassNames.inlineCode}"> world </span>
          </code>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0, 0]
    });

    await toggleCode(page);
  });

  test("can select text and make it `subscript` with the shortcut", async ({
    page
  }) => {
    await toggleSubscript(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sub data-lexical-text="true">
            <span class="${editorClassNames.tSubscript}"> world </span>
          </sub>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0, 0]
    });

    await toggleSubscript(page);
  });

  test("can select text and make it `superscript` with the shortcut", async ({
    page
  }) => {
    await toggleSuperscript(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <sup data-lexical-text="true">
            <span class="${editorClassNames.tSuperscript}"> world </span>
          </sup>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0, 0]
    });

    await toggleSuperscript(page);
  });
});

test.describe("text style", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("should not format the text in the subsequent paragraph after a triple click selection event", async ({
    page
  }) => {
    await page.keyboard.type("hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("hello world");

    await click(page, 'div[contenteditable="true"] > p', {
      clickCount: 1,
      delay: 100
    });
    await click(page, 'div[contenteditable="true"] > p', {
      clickCount: 2,
      delay: 100
    });
    await click(page, 'div[contenteditable="true"] > p', {
      clickCount: 3,
      delay: 100
    });

    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            hello world
          </strong>
        </p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `
    );
  });

  test("can select multiple text parts and format them with shortcuts", async ({
    page
  }) => {
    await page.keyboard.type("Hello world!");
    await moveLeft(page);
    await selectCharacters(page, "left", 5);

    await assertSelection(page, {
      anchorOffset: 11,
      anchorPath: [0, 0, 0],
      focusOffset: 6,
      focusPath: [0, 0, 0]
    });

    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0],
      focusOffset: 0,
      focusPath: [0, 1, 0]
    });

    await moveLeft(page);
    await moveRight(page);
    await selectCharacters(page, "right", 2);

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 1, 0],
      focusOffset: 3,
      focusPath: [0, 1, 0]
    });

    await toggleItalic(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            w
          </strong>
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tItalic}"
            data-lexical-text="true"
          >
            or
          </strong>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            ld
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 2, 0],
      focusOffset: 2,
      focusPath: [0, 2, 0]
    });

    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            w
          </strong>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            or
          </em>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            ld
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 2, 0],
      focusOffset: 2,
      focusPath: [0, 2, 0]
    });

    await moveLeft(page, 2);
    await selectCharacters(page, "right", 5);

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 1, 0],
      focusOffset: 2,
      focusPath: [0, 3, 0]
    });

    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello w</span>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            or
          </em>
          <span data-lexical-text="true">ld!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 2, 0]
    });

    await toggleItalic(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 1, 0],
      focusOffset: 5,
      focusPath: [0, 1, 0]
    });

    await toggleItalic(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world!</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 6,
      anchorPath: [0, 0, 0],
      focusOffset: 11,
      focusPath: [0, 0, 0]
    });
  });

  test("can insert range of formatted text and select part and replace with character", async ({
    page
  }) => {
    await page.keyboard.type("123");

    await toggleBold(page);

    await page.keyboard.type("456");

    await toggleBold(page);

    await page.keyboard.type("789");

    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");

    await page.keyboard.type("abc");

    await toggleBold(page);

    await page.keyboard.type("def");

    await toggleBold(page);

    await page.keyboard.type("ghi");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">123</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            456
          </strong>
          <span data-lexical-text="true">789</span>
          <br />
          <span data-lexical-text="true">abc</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            def
          </strong>
          <span data-lexical-text="true">ghi</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 3,
      anchorPath: [0, 6, 0],
      focusOffset: 3,
      focusPath: [0, 6, 0]
    });

    await page.keyboard.press("ArrowUp");
    await moveToLineBeginning(page);

    await moveRight(page, 2);

    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");

    await moveRight(page, 8);

    await page.keyboard.down("Shift");

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 3,
      focusPath: [0, 6, 0]
    });

    await page.keyboard.type("z");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">12z</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 3,
      anchorPath: [0, 0, 0],
      focusOffset: 3,
      focusPath: [0, 0, 0]
    });
  });

  test("can format backwards when the selection is at the first text node boundary", async ({
    page
  }) => {
    await page.keyboard.type("123456");

    await moveLeft(page, 3);
    await page.keyboard.down("Shift");
    await moveLeft(page, 3);
    await page.keyboard.up("Shift");
    await toggleBold(page);

    await moveToLineEnd(page);
    await page.keyboard.down("Shift");
    await moveLeft(page, 4);
    await page.keyboard.up("Shift");
    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            12
          </strong>
          <span data-lexical-text="true">3456</span>
        </p>
      `
    );

    // Toggle once more
    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
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

    await selectCharacters(page, "left", 3);

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

    await toggleBold(page);
    await toggleItalic(page);
    await toggleUnderline(page);
    await toggleStrikethrough(page);
    await toggleCode(page);
    await toggleSubscript(page);
    await toggleSuperscript(page);

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
