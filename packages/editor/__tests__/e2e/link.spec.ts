import { Page, test } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../src/constants/shortcuts";
import { editorClassNames } from "../constants/class-names";
import {
  deleteBackward,
  moveLeft,
  moveRight,
  moveToLineBeginning,
  moveToLineEnd,
  pressBackspace,
  selectAll,
  selectCharacters,
  toggleBold,
  toggleItalic,
  toggleLink
} from "../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  click,
  focusEditor,
  html,
  initialize,
  keyDownCtrlOrMeta,
  pasteFromClipboard
} from "../utils";

type InsertMethod = "type" | "paste:plain" | "paste:html" | "paste:lexical";

/**
 * Sets the URL of a link node
 * @param page Page
 * @param url URL string
 */
const setURL = async (page: Page, url: string): Promise<void> => {
  await click(page, `button[title="Edit link"]`);
  await pressBackspace(page); // Remove `/` from the input
  await page.keyboard.type(url);
  await page.keyboard.press("Enter");
};

test.describe("link", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can convert a text node into a link", async ({ page }) => {
    await page.keyboard.type("Hello");
    await selectAll(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
        </p>
      `
    );

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0, 0]
    });

    await selectAll(page);
    await setURL(page, "https://storiny.com");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0, 0]
    });

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0]
    });
  });

  test("can convert multi-formatted text into a link (backward)", async ({
    page
  }) => {
    await page.keyboard.type(" abc");

    await toggleBold(page);
    await page.keyboard.type("def");
    await toggleBold(page);

    await toggleItalic(page);
    await page.keyboard.type("ghi");
    await toggleItalic(page);

    await page.keyboard.type(" ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">abc</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            def
          </strong>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            ghi
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 3, 0],
      focusOffset: 1,
      focusPath: [0, 3, 0]
    });

    await moveLeft(page, 1);
    await selectCharacters(page, "left", 9);

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              def
            </strong>
            <em class="${editorClassNames.tItalic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await setURL(page, "https://storiny.com");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              def
            </strong>
            <em class="${editorClassNames.tItalic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );
  });

  test("can convert multi-formatted text into a link (forward)", async ({
    page
  }) => {
    await page.keyboard.type(" abc");

    await toggleBold(page);
    await page.keyboard.type("def");
    await toggleBold(page);

    await toggleItalic(page);
    await page.keyboard.type("ghi");
    await toggleItalic(page);

    await page.keyboard.type(" ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">abc</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            def
          </strong>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            ghi
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 3, 0],
      focusOffset: 1,
      focusPath: [0, 3, 0]
    });

    await moveLeft(page, 10);
    await selectCharacters(page, "right", 9);

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              def
            </strong>
            <em class="${editorClassNames.tItalic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await setURL(page, "https://storiny.com");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              def
            </strong>
            <em class="${editorClassNames.tItalic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );
  });

  test("can create a link in a list and insert a paragraph at the start", async ({
    page
  }) => {
    await page.keyboard.type("- hello");
    await selectCharacters(page, "left", 5);
    await toggleLink(page);
    await moveLeft(page, 1);

    await assertHTML(
      page,
      html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.li}" dir="ltr" value="1">
            <a
              class="${editorClassNames.link}"
              dir="ltr"
              href="/"
              rel="noreferrer"
            >
              <span data-lexical-text="true">hello</span>
            </a>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.li}" value="1"><br /></li>
          <li class="${editorClassNames.li}" value="2">
            <a
              class="${editorClassNames.link}"
              dir="ltr"
              href="/"
              rel="noreferrer"
            >
              <span data-lexical-text="true">hello</span>
            </a>
          </li>
        </ul>
      `
    );
  });

  test("can create a link with some text, insert a paragraph, and then backspace to ensure it merges correctly", async ({
    page
  }) => {
    await page.keyboard.type(" abc def ");
    await moveLeft(page, 5);
    await selectCharacters(page, "left", 3);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
          </a>
          <span data-lexical-text="true">def</span>
        </p>
      `
    );

    await moveLeft(page, 1, 50);
    await moveRight(page, 2, 50);
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">ab</span>
          </a>
        </p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">c</span>
          </a>
          <span data-lexical-text="true">def</span>
        </p>
      `
    );

    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">ab</span>
          </a>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">c</span>
          </a>
          <span data-lexical-text="true">def</span>
        </p>
      `
    );
  });

  test("can create a link and replace all the characters with plain text", async ({
    page
  }) => {
    await page.keyboard.type(" abc ");
    await moveLeft(page, 1);
    await selectCharacters(page, "left", 3);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await page.keyboard.type("a");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can create a link then replace it with plain text", async ({
    page
  }) => {
    await page.keyboard.type(" abc ");
    await moveLeft(page, 1);
    await selectCharacters(page, "left", 3);

    await toggleLink(page);

    await selectCharacters(page, "left", 1);
    await page.keyboard.type("a");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can create a link and partly replace it with plain text", async ({
    page
  }) => {
    await page.keyboard.type(" abc ");
    await moveLeft(page, 1);
    await selectCharacters(page, "left", 3);

    await toggleLink(page);

    await selectCharacters(page, "right", 1);
    await page.keyboard.type("a");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">a</span>
          </a>
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can convert multi-formatted text into a link and modify it afterwards", async ({
    page
  }) => {
    await page.keyboard.type(" abc");

    await toggleBold(page);
    await page.keyboard.type("def");
    await toggleBold(page);

    await toggleItalic(page);
    await page.keyboard.type("ghi");
    await toggleItalic(page);

    await page.keyboard.type(" ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">abc</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            def
          </strong>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            ghi
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 3, 0],
      focusOffset: 1,
      focusPath: [0, 3, 0]
    });

    await moveLeft(page, 1);
    await selectCharacters(page, "left", 9);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              def
            </strong>
            <em class="${editorClassNames.tItalic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await moveRight(page, 1);
    await page.keyboard.type("a");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              def
            </strong>
            <em class="${editorClassNames.tItalic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true">a</span>
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

  test("can insert text inside a link after a formatted text node", async ({
    page
  }) => {
    const linkText = "This is the bold link";
    await page.keyboard.type(linkText);

    // Select all characters
    await selectCharacters(page, "left", linkText.length);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">${linkText}</span>
          </a>
        </p>
      `
    );

    // Move the caret to the end of the link
    await page.keyboard.press("ArrowRight");
    // Move caret to the end of `bold`
    await moveLeft(page, 5);

    // Select the word `bold`
    await selectCharacters(page, "left", 4);
    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is the</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              bold
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );

    // Move caret after `bold`
    await page.keyboard.press("ArrowRight");
    // Change word to `boldest`
    await page.keyboard.type("est");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is the</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              boldest
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );
  });

  test("can insert text inside a link before a formatted text node", async ({
    page
  }) => {
    const linkText = "This is a bold link";
    await page.keyboard.type(linkText);

    // Select all characters
    await selectCharacters(page, "left", linkText.length);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">${linkText}</span>
          </a>
        </p>
      `
    );

    // Move the caret to the end of the link
    await page.keyboard.press("ArrowRight");
    // Move caret to the end of `bold`
    await moveLeft(page, 5);

    // Select the word `bold`
    await selectCharacters(page, "left", 4);
    await toggleBold(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is a</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              bold
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );

    // Move caret to the start of the word `bold`
    await page.keyboard.press("ArrowLeft");
    await selectCharacters(page, "left", 2);

    // Replace `a ` with `the `
    await page.keyboard.type("the ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is the</span>
            <strong class="${editorClassNames.tBold}" data-lexical-text="true">
              bold
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );
  });

  test("can edit link with collapsed selection", async ({ page }) => {
    await page.keyboard.type("A link");
    await selectAll(page);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">A link</span>
          </a>
        </p>
      `
    );

    await moveToLineBeginning(page);
    await setURL(page, "https://storiny.com");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">A link</span>
          </a>
        </p>
      `
    );
  });

  test("can type text before and after the link", async ({ page }) => {
    await page.keyboard.type("link text");
    await selectAll(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">link text</span>
        </p>
      `
    );

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">link text</span>
          </a>
        </p>
      `
    );

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.type("text before link ");
    await moveToLineEnd(page);
    await page.keyboard.type(" text after link");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">text before link </span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">link text</span>
          </a>
          <span data-lexical-text="true"> text after link</span>
        </p>
      `
    );
  });

  test("can delete text up to a link and then add text after the it", async ({
    page
  }) => {
    await page.keyboard.type("some random text");
    await moveLeft(page, 5);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">some random text</span>
        </p>
      `
    );

    await selectCharacters(page, "left", 6);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">some </span>
          <a
            class="${editorClassNames.link}"
            href="/"
            rel="noreferrer"
            dir="ltr"
          >
            <span data-lexical-text="true">random</span>
          </a>
          <span data-lexical-text="true"> text</span>
        </p>
      `
    );

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await deleteBackward(page);

    await page.keyboard.type(", ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">some </span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">random</span>
          </a>
          <span data-lexical-text="true">, text</span>
        </p>
      `
    );
  });

  test("can convert a part of text node into a link with forwards selection", async ({
    page,
    browserName
  }) => {
    await page.keyboard.type("Hello world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </p>
      `
    );

    await moveLeft(page, 5);
    await selectCharacters(page, "right", 5);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [0, 1, 0, 0],
        focusOffset: 5,
        focusPath: [0, 1, 0, 0]
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 6,
        anchorPath: [0, 0, 0],
        focusOffset: 5,
        focusPath: [0, 1, 0, 0]
      });
    }

    await setURL(page, "https://storiny.com");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [0, 1, 0, 0],
        focusOffset: 5,
        focusPath: [0, 1, 0, 0]
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [0, 1],
        focusOffset: 5,
        focusPath: [0, 1, 0, 0]
      });
    }

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
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

  test("can convert a part of text node into a link with backwards selection", async ({
    page,
    browserName
  }) => {
    await page.keyboard.type("Hello world");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </p>
      `
    );

    await selectCharacters(page, "left", 5);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assertSelection(page, {
        anchorOffset: 5,
        anchorPath: [0, 1, 0, 0],
        focusOffset: 0,
        focusPath: [0, 1, 0, 0]
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 5,
        anchorPath: [0, 1, 0, 0],
        focusOffset: 6,
        focusPath: [0, 0, 0]
      });
    }

    await setURL(page, "https://storiny.com");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assertSelection(page, {
        anchorOffset: 5,
        anchorPath: [0, 1, 0, 0],
        focusOffset: 0,
        focusPath: [0, 1, 0, 0]
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 5,
        anchorPath: [0, 1, 0, 0],
        focusOffset: 0,
        focusPath: [0, 1]
      });
    }

    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
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

  test("can convert a part of text node into a link and change the node type", async ({
    page
  }) => {
    await page.keyboard.type("Hello world");
    await selectCharacters(page, "left", 5);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    await page.keyboard.press("ArrowLeft");

    // Convert to a heading
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press(EDITOR_SHORTCUTS.heading.key);
    await keyDownCtrlOrMeta(page);

    await assertHTML(
      page,
      html`
        <h2 class="${editorClassNames.heading}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${editorClassNames.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </h2>
      `
    );
  });

  test("can create multiline links", async ({ page }) => {
    await page.keyboard.type("Hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Hello world");

    await selectAll(page);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello world</span>
          </a>
        </p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello world</span>
          </a>
        </p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello world</span>
          </a>
        </p>
      `
    );
  });

  test("can handle pressing enter inside a link", async ({ page }) => {
    await page.keyboard.type("Hello awesome");

    await selectAll(page);
    await toggleLink(page);

    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("world");

    await moveToLineBeginning(page);
    await moveRight(page, 6);

    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
        </p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">awesome</span>
          </a>
          <span data-lexical-text="true">world</span>
        </p>
      `
    );
  });

  test("can handle pressing enter at the beginning of a link", async ({
    page
  }) => {
    await page.keyboard.type("Hello awesome");

    await selectAll(page);
    await toggleLink(page);

    await page.keyboard.press("ArrowRight");
    await page.keyboard.type(" world");

    await moveToLineBeginning(page);
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}"><br /></p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello awesome</span>
          </a>
          <span data-lexical-text="true">world</span>
        </p>
      `
    );
  });

  test.describe("inserting text on either side of link", () => {
    // In each of the pasting tests, we will paste the letter `x` in a different
    // clipboard data format
    const clipboardData = {
      html: { "text/html": "x" },
      lexical: {
        "application/x-lexical-editor": JSON.stringify({
          namespace: "main",
          nodes: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "x",
              type: "text",
              version: 1
            }
          ]
        })
      },
      plain: { "text/plain": "x" }
    };

    test.describe("inserting text before the link", () => {
      test.describe("start-of-paragraph link", () => {
        const setup = async (
          page: Page,
          insertMethod: InsertMethod
        ): Promise<void> => {
          await focusEditor(page);
          await page.keyboard.type("ab");

          // Turn `a` into a link
          await moveLeft(page, 1);
          await selectCharacters(page, "left", 1);
          await toggleLink(page);

          // Insert a character directly before the link
          await moveLeft(page, 1);

          if (insertMethod === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insertMethod === "paste:plain"
                ? clipboardData.plain
                : insertMethod === "paste:html"
                ? clipboardData.html
                : clipboardData.lexical;
            await pasteFromClipboard(page, data);
          }

          // The character should be inserted before the link
          await assertHTML(
            page,
            html`
              <p class="${editorClassNames.paragraph}" dir="ltr">
                <span data-lexical-text="true">x</span>
                <a
                  class="${editorClassNames.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">a</span>
                </a>
                <span data-lexical-text="true">b</span>
              </p>
            `
          );
        };

        test("can insert text before a start-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text before a start-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before a start-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before a start-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("mid-paragraph links", () => {
        const setup = async (
          page: Page,
          insertMethod: InsertMethod
        ): Promise<void> => {
          await focusEditor(page);
          await page.keyboard.type("abc");

          // Turn `b` into a link
          await moveLeft(page, 1);
          await selectCharacters(page, "left", 1);
          await toggleLink(page);

          // Insert a character directly before the link
          await moveLeft(page, 1);

          if (insertMethod === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insertMethod === "paste:plain"
                ? clipboardData.plain
                : insertMethod === "paste:html"
                ? clipboardData.html
                : clipboardData.lexical;
            await pasteFromClipboard(page, data);
          }

          // The character should be inserted before the link
          await assertHTML(
            page,
            html`
              <p class="${editorClassNames.paragraph}" dir="ltr">
                <span data-lexical-text="true">ax</span>
                <a
                  class="${editorClassNames.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
                <span data-lexical-text="true">c</span>
              </p>
            `
          );
        };

        test("can insert text before a mid-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text before a mid-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        test("can insert text before a mid-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        test("can insert text before a mid-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("end-of-paragraph links", () => {
        const setup = async (
          page: Page,
          insertMethod: InsertMethod
        ): Promise<void> => {
          await focusEditor(page);
          await page.keyboard.type("ab");

          // Turn `b` into a link
          await selectCharacters(page, "left", 1);
          await toggleLink(page);

          // Insert a character directly before the link
          await moveLeft(page, 1);
          if (insertMethod === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insertMethod === "paste:plain"
                ? clipboardData.plain
                : insertMethod === "paste:html"
                ? clipboardData.html
                : clipboardData.lexical;
            await pasteFromClipboard(page, data);
          }

          // The character should be inserted before the link
          await assertHTML(
            page,
            html`
              <p class="${editorClassNames.paragraph}" dir="ltr">
                <span data-lexical-text="true">ax</span>
                <a
                  class="${editorClassNames.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
              </p>
            `
          );
        };

        test("can insert text before an end-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text before an end-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before an end-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before an end-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });
    });

    test.describe("inserting text after links", () => {
      test.describe("start-of-paragraph links", () => {
        const setup = async (
          page: Page,
          insertMethod: InsertMethod
        ): Promise<void> => {
          await focusEditor(page);
          await page.keyboard.type("ab");

          // Turn `a` into a link
          await moveLeft(page, "b".length);
          await selectCharacters(page, "left", 1);
          await toggleLink(page);

          // Insert a character directly after the link
          await moveRight(page, 1);

          if (insertMethod === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insertMethod === "paste:plain"
                ? clipboardData.plain
                : insertMethod === "paste:html"
                ? clipboardData.html
                : clipboardData.lexical;
            await pasteFromClipboard(page, data);
          }

          // The character should be inserted after the link
          await assertHTML(
            page,
            html`
              <p class="${editorClassNames.paragraph}" dir="ltr">
                <a
                  class="${editorClassNames.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">a</span>
                </a>
                <span data-lexical-text="true">xb</span>
              </p>
            `
          );
        };

        test("can insert text after a start-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text after a start-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a start-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a start-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("mid-paragraph links", () => {
        const setup = async (
          page: Page,
          insertMethod: InsertMethod
        ): Promise<void> => {
          await focusEditor(page);
          await page.keyboard.type("abc");

          // Turn `b` into a link
          await moveLeft(page, 1);
          await selectCharacters(page, "left", 1);
          await toggleLink(page);

          // Insert a character directly after the link
          await moveRight(page, 1);

          if (insertMethod === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insertMethod === "paste:plain"
                ? clipboardData.plain
                : insertMethod === "paste:html"
                ? clipboardData.html
                : clipboardData.lexical;
            await pasteFromClipboard(page, data);
          }

          // The character should be inserted after the link
          await assertHTML(
            page,
            html`
              <p class="${editorClassNames.paragraph}" dir="ltr">
                <span data-lexical-text="true">a</span>
                <a
                  class="${editorClassNames.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
                <span data-lexical-text="true">xc</span>
              </p>
            `
          );
        };

        test("can insert text after a mid-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text after a mid-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a mid-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a mid-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("end-of-paragraph links", () => {
        const setup = async (
          page: Page,
          insertMethod: InsertMethod
        ): Promise<void> => {
          await focusEditor(page);
          await page.keyboard.type("ab");

          // Turn `b` into a link
          await selectCharacters(page, "left", 1);
          await toggleLink(page);

          // Insert a character directly after the link
          await moveRight(page, 1);

          if (insertMethod === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insertMethod === "paste:plain"
                ? clipboardData.plain
                : insertMethod === "paste:html"
                ? clipboardData.html
                : clipboardData.lexical;
            await pasteFromClipboard(page, data);
          }

          // The character should be inserted after the link
          await assertHTML(
            page,
            html`
              <p class="${editorClassNames.paragraph}" dir="ltr">
                <span data-lexical-text="true">a</span>
                <a
                  class="${editorClassNames.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
                <span data-lexical-text="true">x</span>
              </p>
            `
          );
        };

        test("can insert text after an end-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text after an end-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after an end-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after an end-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });
    });
  });
});
