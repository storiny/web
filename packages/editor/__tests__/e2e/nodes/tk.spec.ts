import { test } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { editorClassNames } from "../../constants/class-names";
import { moveLeft, pressBackspace } from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  focusEditor,
  html,
  initialize,
  keyDownCtrlOrMeta,
  keyUpCtrlOrMeta
} from "../../utils";

test.describe("tk", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can mark a paragraph with TK", async ({ page }) => {
    await page.keyboard.type("This is a paragraph");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 19,
      anchorPath: [0, 0, 0],
      focusOffset: 19,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.type(" with TK");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 1, 0],
      focusOffset: 2,
      focusPath: [0, 1, 0]
    });
  });

  test("can remove TK with a single backspace (token mode)", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with TK");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 1, 0],
      focusOffset: 2,
      focusPath: [0, 1, 0]
    });

    await pressBackspace(page, 7);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 19,
      anchorPath: [0, 0, 0],
      focusOffset: 19,
      focusPath: [0, 0, 0]
    });
  });

  test("paragraph can handle more than one TK nodes", async ({ page }) => {
    await page.keyboard.type(
      "This is a paragraph with many TK nodes. They look like TK, smell like TK, and work like TK."
    );

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with many</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">nodes. They look like</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">, smell like</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">, and work like</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 8, 0],
      focusOffset: 1,
      focusPath: [0, 8, 0]
    });
  });

  test("removing a single TK from a paragraph having mutliple TK nodes should not alter its class", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 4, 0],
      focusOffset: 1,
      focusPath: [0, 4, 0]
    });

    await pressBackspace(page, 15);

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 1, 0],
      focusOffset: 2,
      focusPath: [0, 1, 0]
    });
  });

  test("can remove multiple TK nodes", async ({ page }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 4, 0],
      focusOffset: 1,
      focusPath: [0, 4, 0]
    });

    await pressBackspace(page, 24);

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 19,
      anchorPath: [0, 0, 0],
      focusOffset: 19,
      focusPath: [0, 0, 0]
    });
  });

  test("can split into multiple nodes when enter is pressed between at-least two TK nodes", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 4, 0],
      focusOffset: 1,
      focusPath: [0, 4, 0]
    });

    await moveLeft(page, 12);
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and</span>
        </p>
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true"> another</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1, 0, 0],
      focusOffset: 0,
      focusPath: [1, 0, 0]
    });
  });

  test("can merge with paragraphs already having TK nodes", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await moveLeft(page, 12);
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and</span>
        </p>
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true"> another</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1, 0, 0],
      focusOffset: 0,
      focusPath: [1, 0, 0]
    });

    await pressBackspace(page);

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 2, 0],
      focusOffset: 4,
      focusPath: [0, 2, 0]
    });
  });

  test("can only be a direct child of a paragraph node", async ({ page }) => {
    await page.keyboard.type("### This is a heading with a TK");

    await assertHTML(
      page,
      html`
        <h3 class="t-major t-head-lg ${editorClassNames.subheading}" dir="ltr">
          <span data-lexical-text="true">This is a heading with a TK</span>
        </h3>
      `
    );
  });

  test("can transform into a text node when the parent paragraph node gets transformed", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with TK");

    await assertHTML(
      page,
      html`
        <p
          class="${editorClassNames.paragraph} ${editorClassNames.tkParagraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with</span>
          <span
            class="${editorClassNames.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 1, 0],
      focusOffset: 2,
      focusPath: [0, 1, 0]
    });

    // Convert to a heading
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press(EDITOR_SHORTCUTS.heading.key);
    await keyUpCtrlOrMeta(page);

    await assertHTML(
      page,
      html`
        <h2 class="t-major t-head-xl ${editorClassNames.heading}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph with TK</span>
        </h2>
      `
    );

    await assertSelection(page, {
      anchorOffset: 27,
      anchorPath: [0, 0, 0],
      focusOffset: 27,
      focusPath: [0, 0, 0]
    });
  });
});
