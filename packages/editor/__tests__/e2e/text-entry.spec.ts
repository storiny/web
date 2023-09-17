import { test } from "@playwright/test";

import { editorClassNames } from "../constants/class-names";
import {
  moveLeft,
  moveToLineBeginning,
  selectAll,
  selectCharacters,
  toggleBold
} from "../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  focusEditor,
  html,
  initialize,
  keyDownCtrlOrAlt,
  keyUpCtrlOrAlt
} from "../utils";

test.describe("text entry", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can type `hello world` in the editor", async ({ page }) => {
    const targetText = "hello world";
    await page.keyboard.type(targetText);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: targetText.length,
      anchorPath: [0, 0, 0],
      focusOffset: targetText.length,
      focusPath: [0, 0, 0]
    });
  });

  test("can insert text and replace it", async ({ page }) => {
    await page.frame("left")?.locator("[data-lexical-editor]").fill("front");
    await page
      .frame("left")
      ?.locator("[data-lexical-editor]")
      .fill("front updated");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">front updated</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 13,
      anchorPath: [0, 0, 0],
      focusOffset: 13,
      focusPath: [0, 0, 0]
    });
  });

  test("can type `hello` as a header and insert a paragraph before", async ({
    page
  }) => {
    await page.keyboard.type("# hello");

    await moveToLineBeginning(page);

    await assertHTML(
      page,
      html`
        <h2 class="${editorClassNames.heading}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </h2>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0, 0, 0],
      focusOffset: 0,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}"><br /></p>
        <h2 class="${editorClassNames.heading}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </h2>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1, 0, 0],
      focusOffset: 0,
      focusPath: [1, 0, 0]
    });
  });

  test("can type `hello world` in the editor and replace it with `foo`", async ({
    page
  }) => {
    const targetText = "hello world";
    await page.keyboard.type(targetText);

    // Select all the text
    await selectAll(page);

    await page.keyboard.type("foo");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">foo</span>
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

  test("can type `hello world` in the editor and replace it with an empty space", async ({
    page
  }) => {
    const targetText = "hello world";
    await page.keyboard.type(targetText);

    // Select all the text
    await selectAll(page);

    await page.keyboard.type(" ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 0, 0],
      focusOffset: 1,
      focusPath: [0, 0, 0]
    });
  });

  test("can handle selection within paragraph", async ({ page }) => {
    await page.keyboard.type("Hello world.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("This is another block.");
    await page.keyboard.down("Shift");
    await moveLeft(page, 6);

    await assertSelection(page, {
      anchorOffset: 22,
      anchorPath: [1, 0, 0],
      focusOffset: 16,
      focusPath: [1, 0, 0]
    });

    await page.keyboard.up("Shift");
    await page.keyboard.type("paragraph.");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world.</span>
        </p>
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is another paragraph.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 26,
      anchorPath: [1, 0, 0],
      focusOffset: 26,
      focusPath: [1, 0, 0]
    });
  });

  test("can delete characters after they are typed", async ({ page }) => {
    const text = "Delete some of these characters.";
    const backspacedText = "Delete some of these characte";

    await page.keyboard.type(text);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Delete some of these characte</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: backspacedText.length,
      anchorPath: [0, 0, 0],
      focusOffset: backspacedText.length,
      focusPath: [0, 0, 0]
    });
  });

  test("can type characters, and select & replace a fragment", async ({
    page
  }) => {
    await page.keyboard.type("Hello world.");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world.</span>
        </p>
      `
    );

    await moveLeft(page, 7);

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0]
    });

    await selectCharacters(page, "right", 1);

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 0, 0],
      focusOffset: 6,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.type(" my ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello my world.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 9,
      anchorPath: [0, 0, 0],
      focusOffset: 9,
      focusPath: [0, 0, 0]
    });
  });

  test("can select and delete a single word", async ({ page, browserName }) => {
    const text = "Delete some of these characters.";
    const backspacedText = "Delete some of these ";

    await page.keyboard.type(text);
    await keyDownCtrlOrAlt(page);
    await page.keyboard.down("Shift");

    // Chrome stops words on punctuation, so we need to trigger
    // the left arrow key one more time.
    await moveLeft(page, browserName === "chromium" ? 2 : 1);
    await page.keyboard.up("Shift");
    await keyUpCtrlOrAlt(page);

    // Ensure the selection is now covering the whole word and period.
    await assertSelection(page, {
      anchorOffset: text.length,
      anchorPath: [0, 0, 0],
      focusOffset: backspacedText.length,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">Delete some of these</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: backspacedText.length,
      anchorPath: [0, 0, 0],
      focusOffset: backspacedText.length,
      focusPath: [0, 0, 0]
    });
  });

  test("can handle backspace on the first paragraph", async ({ page }) => {
    // Add some trimmable text
    await page.keyboard.type("  ");

    // Add paragraph
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <span data-lexical-text="true"></span>
        </p>
        <p class="${editorClassNames.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1],
      focusOffset: 0,
      focusPath: [1]
    });

    // Move to the previous paragraph and press backspace
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html` <p class="${editorClassNames.paragraph}"><br /></p> `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });
  });

  test("can handle a combination of paragraphs, break points, and bi-directional text", async ({
    page
  }) => {
    // Add some line breaks
    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <br />
          <br />
          <br />
          <br />
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 3,
      anchorPath: [0],
      focusOffset: 3,
      focusPath: [0]
    });

    // Move to the top
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    // Add a paragraph
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}"><br /></p>
        <p class="${editorClassNames.paragraph}">
          <br />
          <br />
          <br />
          <br />
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1],
      focusOffset: 0,
      focusPath: [1]
    });

    // Handling RTL (bidi) text
    await page.keyboard.press("ArrowUp");
    await page.keyboard.type("هَ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
        <p class="${editorClassNames.paragraph}">
          <br />
          <br />
          <br />
          <br />
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });
  });

  test("can select empty paragraph and new line nodes", async ({ page }) => {
    // Add a paragraph
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}"><br /></p>
        <p class="${editorClassNames.paragraph}"><br /></p>
      `
    );

    await page.pause();

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1],
      focusOffset: 0,
      focusPath: [1]
    });

    await page.keyboard.press("ArrowLeft");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    await page.keyboard.press("ArrowRight");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1],
      focusOffset: 0,
      focusPath: [1]
    });

    await page.keyboard.press("ArrowLeft");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    // Remove the paragraph
    await page.keyboard.press("Delete");

    await assertHTML(
      page,
      html` <p class="${editorClassNames.paragraph}"><br /></p> `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    // Add line break
    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <br />
          <br />
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0],
      focusOffset: 1,
      focusPath: [0]
    });

    await page.keyboard.press("ArrowLeft");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}">
          <br />
          <br />
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    // Remove line break
    await page.keyboard.press("Delete");

    await assertHTML(
      page,
      html` <p class="${editorClassNames.paragraph}"><br /></p> `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });
  });
});
