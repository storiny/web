import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES, IS_LINUX } from "../../constants";
import {
  moveToPrevWord,
  selectAll,
  toggleLink
} from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  copy_to_clipboard,
  focusEditor,
  html,
  initialize,
  pasteFromClipboard
} from "../../utils";

test.describe("lexical copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can perform basic copy and paste", async ({ page, browserName }) => {
    // Add a paragraph
    await page.keyboard.type("Copy + pasting?");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Sounds good!");

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 12,
      anchorPath: [2, 0, 0],
      focusOffset: 12,
      focusPath: [2, 0, 0]
    });

    // Select all the text
    await selectAll(page);

    await assertHTML(
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
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [],
        focusOffset: 3,
        focusPath: []
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [0, 0, 0],
        focusOffset: 12,
        focusPath: [2, 0, 0]
      });
    }

    // Copy all the text
    const clipboard = await copy_to_clipboard(page);

    await assertHTML(
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
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 12,
      anchorPath: [4, 0, 0],
      focusOffset: 12,
      focusPath: [4, 0, 0]
    });
  });

  test("can copy and paste between sections", async ({ page, browserName }) => {
    test.skip(browserName === "firefox");

    await page.keyboard.type("Hello world test");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Next line of text");

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 17,
      anchorPath: [1, 0, 0],
      focusOffset: 17,
      focusPath: [1, 0, 0]
    });

    // Select all the content
    await selectAll(page);

    if (browserName === "firefox") {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [],
        focusOffset: 2,
        focusPath: []
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [0, 0, 0],
        focusOffset: 17,
        focusPath: [1, 0, 0]
      });
    }

    // Copy all the text
    let clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Delete");
    // Paste the content
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 17,
      anchorPath: [1, 0, 0],
      focusOffset: 17,
      focusPath: [1, 0, 0]
    });

    await moveToPrevWord(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowUp");
    await moveToPrevWord(page);

    // Once more for linux on Chromium
    if (IS_LINUX && browserName === "chromium") {
      await moveToPrevWord(page);
    }

    await page.keyboard.up("Shift");

    await assertSelection(page, {
      anchorOffset: 13,
      anchorPath: [1, 0, 0],
      focusOffset: 0,
      focusPath: [0, 0, 0]
    });

    // Copy selected text
    clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Delete");
    // Paste the content
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 13,
      anchorPath: [1, 0, 0],
      focusOffset: 13,
      focusPath: [1, 0, 0]
    });

    // Select all the content
    await selectAll(page);

    if (browserName === "firefox") {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [],
        focusOffset: 2,
        focusPath: []
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [0, 0, 0],
        focusOffset: 17,
        focusPath: [1, 0, 0]
      });
    }

    await page.keyboard.press("Delete");

    await assertHTML(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
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
    await selectAll(page);
    await toggleLink(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await page.keyboard.type("World");

    await selectAll(page);
    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("ArrowRight");
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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
    await pasteFromClipboard(page, {
      "text/plain": "world\nAnd text below"
    });

    await assertHTML(
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
