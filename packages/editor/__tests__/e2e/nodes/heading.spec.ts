import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import { move_right, move_to_editor_beginning } from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize
} from "../../utils";

test.describe("heading", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can convert headings higher than or equal to `h2` into `h2` (heading)", async ({
    page
  }) => {
    await page.keyboard.type("# heading 1");
    await page.keyboard.press("Enter");
    await page.keyboard.type("## heading 2");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">heading 1</span>
        </h2>
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">heading 2</span>
        </h2>
      `
    );

    await assert_selection(page, {
      anchor_offset: 9,
      anchor_path: [1, 0, 0],
      focus_offset: 9,
      focus_path: [1, 0, 0]
    });
  });

  test("can convert headings lower than or equal to `h3` into `h3` (subheading)", async ({
    page
  }) => {
    await page.keyboard.type("### heading 3");
    await page.keyboard.press("Enter");
    await page.keyboard.type("#### heading 4");
    await page.keyboard.press("Enter");
    await page.keyboard.type("##### heading 5");
    await page.keyboard.press("Enter");
    await page.keyboard.type("###### heading 6");

    await assert_html(
      page,
      html`
        <h3 class="${EDITOR_CLASSNAMES.subheading}" dir="ltr">
          <span data-lexical-text="true">heading 3</span>
        </h3>
        <h3 class="${EDITOR_CLASSNAMES.subheading}" dir="ltr">
          <span data-lexical-text="true">heading 4</span>
        </h3>
        <h3 class="${EDITOR_CLASSNAMES.subheading}" dir="ltr">
          <span data-lexical-text="true">heading 5</span>
        </h3>
        <h3 class="${EDITOR_CLASSNAMES.subheading}" dir="ltr">
          <span data-lexical-text="true">heading 6</span>
        </h3>
      `
    );

    await assert_selection(page, {
      anchor_offset: 9,
      anchor_path: [3, 0, 0],
      focus_offset: 9,
      focus_path: [3, 0, 0]
    });
  });

  test("stays as a heading when backspace is pressed at the start of a heading with no previous sibling nodes present", async ({
    page
  }) => {
    await page.keyboard.type("# hello world");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </h2>
      `
    );

    await move_to_editor_beginning(page);
    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </h2>
      `
    );
  });

  test("stays as a heading when enter is pressed in the middle of a heading", async ({
    page
  }) => {
    await page.keyboard.type("# hello world");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </h2>
      `
    );

    await move_to_editor_beginning(page);
    await move_right(page, 6);
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </h2>
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true"> world</span>
        </h2>
      `
    );
  });

  test("changes to a paragraph when enter is pressed at the end of a heading", async ({
    page
  }) => {
    await page.keyboard.type("# hello world");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </h2>
      `
    );

    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );
  });
});
