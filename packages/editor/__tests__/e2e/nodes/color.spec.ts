import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import { press_backspace } from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  click,
  focus_editor,
  html,
  initialize
} from "../../utils";

test.describe("color", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can create a color node", async ({ page }) => {
    await click(page, `[data-testid="code-toggle"]`);
    await page.keyboard.type("#000");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <code spellcheck="false" data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.color}" style="--color: #000">
              #000
            </span>
          </code>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 0, 0, 0],
      focus_offset: 4,
      focus_path: [0, 0, 0, 0]
    });
  });

  test("can delete a color node (token mode)", async ({ page }) => {
    await click(page, `[data-testid="code-toggle"]`);
    await page.keyboard.type("#000");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <code spellcheck="false" data-lexical-text="true">
            <span class="${EDITOR_CLASSNAMES.color}" style="--color: #000">
              #000
            </span>
          </code>
        </p>
      `
    );

    await press_backspace(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });
  });
});
