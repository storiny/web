import { editorClassNames } from "../constants/class-names";
import {
  assertHTML,
  assertSelection,
  expect,
  focusEditor,
  html,
  initialize,
  test,
  textContent
} from "../utils";

test.describe("placeholder", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("displays a placeholder when no content is present", async ({
    page
  }) => {
    await focusEditor(page);
    const content = await textContent(page, '[data-testid="placeholder"]');

    expect(content).toBe("Share your story…");

    await assertHTML(
      page,
      html`<p class="${editorClassNames.paragraph}"><br /></p>`
    );
    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });
  });
});
