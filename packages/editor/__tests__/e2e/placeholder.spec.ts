import { expect, test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  assertHTML,
  assertSelection,
  focusEditor,
  html,
  initialize,
  textContent
} from "../utils";

test.describe("placeholder", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("displays a placeholder when the editor is empty", async ({ page }) => {
    await focusEditor(page);
    const content = await textContent(page, '[data-testid="placeholder"]');

    expect(content).toBe("Share your story…");

    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });
  });
});
