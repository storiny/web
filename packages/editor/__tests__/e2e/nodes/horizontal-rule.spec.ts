import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  moveLeft,
  moveToLineBeginning,
  pressBackspace,
  selectAll
} from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  copy_to_clipboard,
  focusEditor,
  html,
  initialize,
  insertHorizontalRule,
  pasteFromClipboard,
  waitForSelector
} from "../../utils";

test.describe("horizontal rule", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can create a horizontal rule and move selection around it", async ({
    page,
    browserName
  }) => {
    await insertHorizontalRule(page);
    await waitForSelector(page, "hr");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });

    await page.keyboard.press("ArrowUp");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    await page.keyboard.type("Some text");

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });

    await page.keyboard.type("Some more text");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some more text</span>
        </p>
      `
    );

    await moveToLineBeginning(page);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");

    if (browserName === "webkit") {
      await assertSelection(page, {
        anchorOffset: 9,
        anchorPath: [0, 0, 0],
        focusOffset: 9,
        focusPath: [0, 0, 0]
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 1,
        anchorPath: [0],
        focusOffset: 1,
        focusPath: [0]
      });
    }

    await pressBackspace(page, 10);

    if (browserName === "webkit") {
      await assertSelection(page, {
        anchorOffset: 1,
        anchorPath: [],
        focusOffset: 1,
        focusPath: []
      });
    } else {
      await assertSelection(page, {
        anchorOffset: 0,
        anchorPath: [],
        focusOffset: 0,
        focusPath: []
      });
    }
  });

  test("adds a horizontal rule at the end of the current text node and moves the selection to the new paragraph node", async ({
    page
  }) => {
    await page.keyboard.type("Test");

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 0, 0],
      focusOffset: 4,
      focusPath: [0, 0, 0]
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Test</span>
        </p>
      `
    );

    await insertHorizontalRule(page);
    await waitForSelector(page, "hr");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Test</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });
  });

  test("adds a horizontal rule and splits a text node across 2 paragraphs if the caret is in the middle of the text node, moving the selection to the start of the new paragraph node", async ({
    page
  }) => {
    await page.keyboard.type("Test");

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 0, 0],
      focusOffset: 4,
      focusPath: [0, 0, 0]
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Test</span>
        </p>
      `
    );

    await moveLeft(page, 2);

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });

    await insertHorizontalRule(page);
    await waitForSelector(page, "hr");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Te</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">st</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2, 0, 0],
      focusOffset: 0,
      focusPath: [2, 0, 0]
    });
  });

  test("can copy and paste a horizontal rule", async ({ page }) => {
    await insertHorizontalRule(page);
    await waitForSelector(page, "hr");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });

    // Select all the text, copy it and delete it
    await selectAll(page);
    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Backspace");

    // Paste it again
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Backspace");

    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [2],
      focusOffset: 0,
      focusPath: [2]
    });
  });
});
