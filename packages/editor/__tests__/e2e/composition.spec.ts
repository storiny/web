import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize
} from "../utils";

test.use({ launchOptions: { slowMo: 50 } });

test.describe("composition", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("handles Hiragana characters", async ({ page }) => {
    await page.keyboard.type("も");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">も</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 0, 0],
      focus_offset: 1,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

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

    await page.keyboard.type("もじ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">もじ</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });
  });

  test("handles Arabic characters with diacritics", async ({
    page,
    browserName
  }) => {
    test.skip(browserName === "firefox");

    await page.keyboard.type("هَ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="rtl">
          <span data-lexical-text="true">ه</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 0, 0],
      focus_offset: 1,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await page.keyboard.type("هَ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("ArrowRight");

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("Delete");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });
  });
});
