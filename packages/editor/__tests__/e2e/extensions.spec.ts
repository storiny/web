import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  assert_html,
  assert_selection,
  evaluate,
  focus_editor,
  html,
  initialize
} from "../utils";

test.describe("extensions", () => {
  test.beforeEach(({ page }) => initialize(page));

  test(`document.execCommand("insertText")`, async ({ page }) => {
    await focus_editor(page);
    await evaluate(page, () => {
      document.execCommand("insertText", false, "hello");
    });

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0]
    });
  });

  test(`ClipboardEvent("paste")`, async ({ page, browserName }) => {
    // Pasting this way doesn't work in FF due to content
    // privacy reasons.
    if (browserName === "firefox") {
      return;
    }

    await focus_editor(page);

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

      const editor = document.querySelector('section[contenteditable="true"]');
      const dispatch_paste = paste();

      if (editor) {
        dispatch_paste(editor, "hello");
      }
    });

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0]
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

      const editor = document.querySelector('section[contenteditable="true"]');
      const dispatch_paste = paste();

      if (editor) {
        dispatch_paste(editor, " world");
      }
    });

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 11,
      anchor_path: [0, 0, 0],
      focus_offset: 11,
      focus_path: [0, 0, 0]
    });
  });

  test(`ClipboardEvent("paste") + document.execCommand("insertText")`, async ({
    page,
    browserName
  }) => {
    test.skip(browserName === "firefox");

    await focus_editor(page);
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

      const editor = document.querySelector('section[contenteditable="true"]');
      const dispatch_paste = paste();

      if (editor) {
        dispatch_paste(editor, "hello");
      }

      document.execCommand("InsertText", false, " world");
    });

    // Pasting this way doesn't work in FF due to content
    // privacy reasons. So we only look for the execCommand output.
    if (browserName === "firefox") {
      await assert_html(
        page,
        html`
          <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
            <span data-lexical-text="true"> world</span>
          </p>
        `
      );

      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 0, 0],
        focus_offset: 5,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_html(
        page,
        html`
          <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
            <span data-lexical-text="true">hello world</span>
          </p>
        `
      );

      await assert_selection(page, {
        anchor_offset: 11,
        anchor_path: [0, 0, 0],
        focus_offset: 11,
        focus_path: [0, 0, 0]
      });
    }
  });

  test(`document.execCommand("insertText") with selection`, async ({
    page
  }) => {
    await focus_editor(page);

    await page.keyboard.type("hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("asd t");
    await page.keyboard.press("ArrowUp");

    // Selection is at the last paragraph
    await evaluate(page, async () => {
      const editor = document.querySelector('section[contenteditable="true"]');
      const selection = window.getSelection();
      const second_paragraph_text_node =
        editor?.firstChild?.nextSibling?.firstChild?.firstChild;

      if (second_paragraph_text_node) {
        selection?.setBaseAndExtent(
          second_paragraph_text_node,
          0,
          second_paragraph_text_node,
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

    await assert_html(
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

    await assert_selection(page, {
      anchor_offset: 3,
      anchor_path: [1, 0, 0],
      focus_offset: 3,
      focus_path: [1, 0, 0]
    });
  });
});
