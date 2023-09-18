import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  assertHTML,
  assertSelection,
  evaluate,
  focusEditor,
  html,
  initialize
} from "../utils";

test.describe("extensions", () => {
  test.beforeEach(({ page }) => initialize(page));

  test(`document.execCommand("insertText")`, async ({ page }) => {
    await focusEditor(page);
    await evaluate(page, () => {
      document.execCommand("insertText", false, "hello");
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0]
    });
  });

  test(`ClipboardEvent("paste")`, async ({ page, browserName }) => {
    // Pasting this way doesn't work in FF due to content
    // privacy reasons.
    if (browserName === "firefox") {
      return;
    }

    await focusEditor(page);

    await evaluate(page, () => {
      const paste = (): ((target: Element, text: string) => void) => {
        const dataTransfer = new DataTransfer();

        return (target: Element, text: string): void => {
          dataTransfer.setData("text/plain", text);
          target.dispatchEvent(
            new ClipboardEvent("paste", {
              bubbles: true,
              cancelable: true,
              clipboardData: dataTransfer
            })
          );
          dataTransfer.clearData();
        };
      };

      const editor = document.querySelector('div[contenteditable="true"]');
      const dispatchPaste = paste();

      if (editor) {
        dispatchPaste(editor, "hello");
      }
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 0, 0]
    });

    await evaluate(page, () => {
      const paste = (): ((target: Element, text: string) => void) => {
        const dataTransfer = new DataTransfer();

        return (target: Element, text: string): void => {
          dataTransfer.setData("text/plain", text);
          target.dispatchEvent(
            new ClipboardEvent("paste", {
              bubbles: true,
              cancelable: true,
              clipboardData: dataTransfer
            })
          );
          dataTransfer.clearData();
        };
      };

      const editor = document.querySelector('div[contenteditable="true"]');
      const dispatchPaste = paste();

      if (editor) {
        dispatchPaste(editor, " world");
      }
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 11,
      anchorPath: [0, 0, 0],
      focusOffset: 11,
      focusPath: [0, 0, 0]
    });
  });

  test(`ClipboardEvent("paste") + document.execCommand("insertText")`, async ({
    page,
    browserName
  }) => {
    test.skip(browserName === "firefox");

    await focusEditor(page);
    await evaluate(page, () => {
      const paste = (): ((target: Element, text: string) => void) => {
        const dataTransfer = new DataTransfer();

        return (target: Element, text: string): void => {
          dataTransfer.setData("text/plain", text);
          target.dispatchEvent(
            new ClipboardEvent("paste", {
              bubbles: true,
              cancelable: true,
              clipboardData: dataTransfer
            })
          );
          dataTransfer.clearData();
        };
      };

      const editor = document.querySelector('div[contenteditable="true"]');
      const dispatchPaste = paste();

      if (editor) {
        dispatchPaste(editor, "hello");
      }

      document.execCommand("InsertText", false, " world");
    });

    // Pasting this way doesn't work in FF due to content
    // privacy reasons. So we only look for the execCommand output.
    if (browserName === "firefox") {
      await assertHTML(
        page,
        html`
          <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
            <span data-lexical-text="true"> world</span>
          </p>
        `
      );

      await assertSelection(page, {
        anchorOffset: 5,
        anchorPath: [0, 0, 0],
        focusOffset: 5,
        focusPath: [0, 0, 0]
      });
    } else {
      await assertHTML(
        page,
        html`
          <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
            <span data-lexical-text="true">hello world</span>
          </p>
        `
      );

      await assertSelection(page, {
        anchorOffset: 11,
        anchorPath: [0, 0, 0],
        focusOffset: 11,
        focusPath: [0, 0, 0]
      });
    }
  });

  test(`document.execCommand("insertText") with selection`, async ({
    page
  }) => {
    await focusEditor(page);

    await page.keyboard.type("hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("asd t");
    await page.keyboard.press("ArrowUp");

    // Selection is at the last paragraph
    await evaluate(page, async () => {
      const editor = document.querySelector('div[contenteditable="true"]');
      const selection = window.getSelection();
      const secondParagraphTextNode =
        editor?.firstChild?.nextSibling?.firstChild?.firstChild;

      if (secondParagraphTextNode) {
        selection?.setBaseAndExtent(
          secondParagraphTextNode,
          0,
          secondParagraphTextNode,
          3
        );
      }

      await new Promise<void>((resolve) => {
        setTimeout(() => {
          document.execCommand("insertText", false, "and");
          resolve();
        }, 500);
      });
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">and t</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 3,
      anchorPath: [1, 0, 0],
      focusOffset: 3,
      focusPath: [1, 0, 0]
    });
  });
});
