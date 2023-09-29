import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  extendToNextWord,
  moveLeft,
  moveToEditorBeginning,
  moveToEditorEnd,
  moveToLineBeginning,
  moveToNextWord,
  pressBackspace,
  selectAll,
  toggleLink
} from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  click,
  copy_to_clipboard,
  focusEditor,
  html,
  initialize,
  pasteFromClipboard,
  sleep
} from "../../utils";

test.describe("html link copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can copy and paste an anchor element", async ({ page }) => {
    const clipboard = {
      "text/html": '<a href="https://storiny.com">storiny</a>'
    };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 7,
      anchorPath: [0, 0, 0, 0],
      focusOffset: 7,
      focusPath: [0, 0, 0, 0]
    });

    await selectAll(page);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true">storiny</span>
        </p>
      `
    );

    await toggleLink(page);
    await click(page, `button[title="Edit link"]`);
    await pressBackspace(page); // Remove `/` from the input
    await page.keyboard.type("https://storiny.com");
    await page.keyboard.press("Enter");

    await assertHTML(
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
    await pasteFromClipboard(page, {
      "text/html": `text <a href="https://storiny.com">link</a> text`
    });
    await moveToEditorBeginning(page);
    await pasteFromClipboard(page, {
      "text/html": "before"
    });
    await moveToEditorEnd(page);
    await pasteFromClipboard(page, {
      "text/html": "after"
    });

    await sleep(500);

    await assertHTML(
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

    await pasteFromClipboard(page, {
      "text/html": `text <a href="https://storiny.com">link</a> text`
    });
    await moveLeft(page, 5);
    await page.keyboard.down("Shift");
    await moveLeft(page, 2);
    await page.keyboard.up("Shift");

    const clipboard = await copy_to_clipboard(page);
    await moveToEditorEnd(page);
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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
    await moveToLineBeginning(page);
    await moveToNextWord(page);
    await extendToNextWord(page);

    const clipboard = {
      text: `https://storiny.com`
    };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
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
