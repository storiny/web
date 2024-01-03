import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import { press_backspace } from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  insert_code_block,
  wait_for_selector
} from "../../utils";

test.describe("code-block", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can add code block nodes and delete them correctly", async ({
    page,
    browserName
  }) => {
    await insert_code_block(page);

    // Wait for the node to initialize.
    await wait_for_selector(
      page,
      `div[data-testid="code-block-node"][data-status="loaded"]`,
      { state: "attached" }
    );

    await assert_html(page, html` <div><br /></div> `, undefined, {
      ignore_classes: true,
      ignore_inline_styles: true,
      selector: ".cm-content"
    });

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [3],
      focus_offset: 0,
      focus_path: [3]
    });

    // Remove code block node using backspace

    await focus_editor(page);
    await press_backspace(page, browserName === "firefox" ? 4 : 3);

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });
  });

  test("can type inside code block node", async ({ page }) => {
    await insert_code_block(page);

    // Wait for the node to initialize.
    await wait_for_selector(
      page,
      `div[data-testid="code-block-node"][data-status="loaded"]`,
      { state: "attached" }
    );

    // Should be empty initially
    await assert_html(page, html` <div><br /></div> `, undefined, {
      ignore_classes: true,
      ignore_inline_styles: true,
      selector: ".cm-content"
    });

    // Focus the CodeMirror editor
    await page.frame("left")?.locator(".cm-content").focus();

    await page.keyboard.type(`const foo = "bar";`);
    await page.keyboard.press("Enter");
    await page.keyboard.type(`const sum = (a, b) => a + b;`);

    await assert_html(
      page,
      html`
        <div>const foo = "bar";</div>
        <div>const sum = (a, b) =&gt; a + b;</div>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true,
        selector: ".cm-content"
      }
    );
  });
});
