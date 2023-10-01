import { expect, test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  text_content
} from "../utils";

test.describe("placeholder", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("displays a placeholder when the editor is empty", async ({ page }) => {
    await focus_editor(page);
    const content = await text_content(page, '[data-testid="placeholder"]');

    expect(content).toBe("Share your story…");

    await assert_html(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });
  });
});
