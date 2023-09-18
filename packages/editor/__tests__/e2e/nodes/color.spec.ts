import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import { pressBackspace } from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  click,
  focusEditor,
  html,
  initialize
} from "../../utils";

test.describe("color", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can create a color node", async ({ page }) => {
    await click(page, `[data-testid="code-toggle"]`);
    await page.keyboard.type("#000");

    await assertHTML(
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

    await assertSelection(page, {
      anchorOffset: 4,
      anchorPath: [0, 0, 0, 0],
      focusOffset: 4,
      focusPath: [0, 0, 0, 0]
    });
  });

  test("can delete a color node (token mode)", async ({ page }) => {
    await click(page, `[data-testid="code-toggle"]`);
    await page.keyboard.type("#000");

    await assertHTML(
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

    await pressBackspace(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
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
  });
});
