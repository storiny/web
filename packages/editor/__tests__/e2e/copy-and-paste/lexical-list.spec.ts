import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES, IS_WINDOWS } from "../../constants";
import {
  moveLeft,
  moveToLineBeginning,
  moveToLineEnd,
  selectAll
} from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  copyToClipboard,
  focusEditor,
  html,
  initialize,
  pasteFromClipboard,
  sleep
} from "../../utils";

test.describe("lexical list copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can copy and paste partial list items into an empty editor", async ({
    page
  }) => {
    // Add three list items
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    // Add a paragraph
    await page.keyboard.type("Some text.");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 10,
      anchorPath: [1, 0, 0],
      focusOffset: 10,
      focusPath: [1, 0, 0]
    });

    await page.keyboard.down("Shift");
    await moveToLineBeginning(page);
    await moveLeft(page, 3);
    await page.keyboard.up("Shift");

    await assertSelection(page, {
      anchorOffset: 10,
      anchorPath: [1, 0, 0],
      focusOffset: 3,
      focusPath: [0, 2, 0, 0]
    });

    // Copy the partial list item and paragraph
    const clipboard = await copyToClipboard(page);
    // Select all and remove content
    await selectAll(page);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    // Paste

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">ee</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 10,
      anchorPath: [1, 0, 0],
      focusOffset: 10,
      focusPath: [1, 0, 0]
    });
  });

  test("can copy and paste partial list items into a list", async ({
    page,
    browserName
  }) => {
    // Add three list items
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    // Add a paragraph
    await page.keyboard.type("Some text.");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 10,
      anchorPath: [1, 0, 0],
      focusOffset: 10,
      focusPath: [1, 0, 0]
    });

    await page.keyboard.down("Shift");
    await moveToLineBeginning(page);
    await moveLeft(page, 3);
    await page.keyboard.up("Shift");

    await assertSelection(page, {
      anchorOffset: 10,
      anchorPath: [1, 0, 0],
      focusOffset: 3,
      focusPath: [0, 2, 0, 0]
    });

    // Copy the partial list item and paragraph
    const clipboard = await copyToClipboard(page);
    // Select all and remove content
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    if (!IS_WINDOWS && browserName === "firefox") {
      await page.keyboard.press("ArrowUp");
    }

    await moveToLineEnd(page);
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}">
            <br />
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 1],
      focusOffset: 0,
      focusPath: [0, 1]
    });

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">ee</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 10,
      anchorPath: [1, 0, 0],
      focusOffset: 10,
      focusPath: [1, 0, 0]
    });
  });

  test("can copy list items and paste them back a list", async ({ page }) => {
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await moveToLineBeginning(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await moveToLineEnd(page);
    await page.keyboard.up("Shift");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 2, 0, 0],
      focusOffset: 4,
      focusPath: [0, 3, 0, 0]
    });

    const clipboard = await copyToClipboard(page);
    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}"><br /></li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 2],
      focusOffset: 0,
      focusPath: [0, 2]
    });

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 3, 0, 0],
      focusOffset: 4,
      focusPath: [0, 3, 0, 0]
    });
  });

  test("can copy list items and them paste back into the list on an existing item", async ({
    page
  }) => {
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await moveToLineBeginning(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await moveToLineEnd(page);
    await page.keyboard.up("Shift");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 2, 0, 0],
      focusOffset: 4,
      focusPath: [0, 3, 0, 0]
    });

    const clipboard = await copyToClipboard(page);
    await page.keyboard.press("ArrowRight");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 3, 0, 0],
      focusOffset: 4,
      focusPath: [0, 3, 0, 0]
    });

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">fourthree</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="6" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 4, 0, 0],
      focusOffset: 4,
      focusPath: [0, 4, 0, 0]
    });
  });

  test("can copy and paste two paragraphs into a list on an existing item", async ({
    page
  }) => {
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("world");

    await selectAll(page);
    const clipboard = await copyToClipboard(page);
    await page.keyboard.press("Backspace");

    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await moveToLineBeginning(page);
    await page.keyboard.press("ArrowDown");
    await moveToLineEnd(page);
    await moveLeft(page, 2);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 3, 0, 0],
      focusOffset: 2,
      focusPath: [0, 3, 0, 0]
    });

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">fohello</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">worldur</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [1, 0, 0],
      focusOffset: 5,
      focusPath: [1, 0, 0]
    });
  });

  test("can copy and paste two paragraphs at the end of a list", async ({
    page
  }) => {
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("world");

    await selectAll(page);
    const clipboard = await copyToClipboard(page);
    await page.keyboard.press("Backspace");

    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");
    await page.keyboard.press("Enter");

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
          <li value="6" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">world</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [1, 0, 0],
      focusOffset: 5,
      focusPath: [1, 0, 0]
    });

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
          <li value="6" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">worldhello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">world</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [2, 0, 0],
      focusOffset: 5,
      focusPath: [2, 0, 0]
    });
  });
});
