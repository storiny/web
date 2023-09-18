import { expect, Page, test } from "@playwright/test";
import { testAsset } from "@storiny/ui/src/mocks";

import { EDITOR_CLASSNAMES, IS_MAC } from "../constants";
import {
  deleteBackward,
  deleteForward,
  moveLeft,
  moveToPrevWord,
  selectAll
} from "../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  evaluate,
  focusEditor,
  html,
  initialize,
  insertImage,
  keyDownCtrlOrMeta,
  keyUpCtrlOrMeta,
  pasteFromClipboard,
  sleep
} from "../utils";

const ROUTE = "*/**/v1/me/assets?page=1";

const assetsRouteHandler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({ json: [testAsset] });
};

test.describe("selection", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
    await page.route(ROUTE, assetsRouteHandler);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, assetsRouteHandler);
  });

  test("does not focus the editor on load", async ({ page }) => {
    const editorHasFocus = async (): Promise<boolean> =>
      await evaluate(page, () => {
        const editorElement = document.querySelector(
          'div[contenteditable="true"]'
        );
        return document.activeElement === editorElement;
      });

    await evaluate(page, () => {
      const editorElement = document.querySelector(
        'div[contenteditable="true"]'
      ) as HTMLElement;
      return editorElement?.blur();
    });

    expect(await editorHasFocus()).toEqual(false);
    await sleep(500);
    expect(await editorHasFocus()).toEqual(false);
  });

  test("can delete text by line using Cmd+Delete (Mac)", async ({ page }) => {
    test.skip(!IS_MAC);

    await page.keyboard.type("One");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Two");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Three");

    const deleteLine = async (): Promise<void> => {
      await keyDownCtrlOrMeta(page);
      await page.keyboard.press("Backspace");
      await keyUpCtrlOrMeta(page);
    };

    const lines = [
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">One</span>
        </p>
      `,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Two</span>
        </p>
      `,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Three</span>
        </p>
      `
    ];

    await deleteLine();
    await assertHTML(page, lines.slice(0, 3).join(""));
    await deleteLine();
    await assertHTML(page, lines.slice(0, 2).join(""));
    await deleteLine();
    await assertHTML(page, lines.slice(0, 1).join(""));
    await deleteLine();

    await assertHTML(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );
  });

  test("can insert an inline element within the text and move the selection after it", async ({
    page
  }) => {
    await page.keyboard.type("Hello world");
    await moveToPrevWord(page);
    await pasteFromClipboard(page, {
      "text/html": `<a href="https://example.com">link</a>`
    });
    await sleep(3000);

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 4,
      focusPath: [0, 1, 0, 0]
    });
  });

  test("can select everything with node selection", async ({ page }) => {
    await page.keyboard.type("# Text before");
    await insertImage(page);
    await focusEditor(page);
    await page.keyboard.type("Text after");
    await selectAll(page);
    await deleteBackward(page);

    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );
  });

  test("can delete block elements", async ({ page }) => {
    await page.keyboard.type("# A");
    await page.keyboard.press("Enter");
    await page.keyboard.type("b");

    await assertHTML(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">A</span>
        </h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );

    await moveLeft(page, 2);
    await deleteBackward(page);

    await assertHTML(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}">
          <br />
        </h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );

    await deleteBackward(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );

    await deleteBackward(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );
  });

  test("can delete sibling elements forward", async ({ page }) => {
    await page.keyboard.press("Enter");
    await page.keyboard.type("# Title");
    await page.keyboard.press("ArrowUp");

    await sleep(500);
    await deleteForward(page);

    await assertHTML(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">Title</span>
        </h2>
      `
    );
  });
});
