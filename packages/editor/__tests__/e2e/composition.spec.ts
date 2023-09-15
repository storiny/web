import { test } from "@playwright/test";

import { editorClassNames } from "../constants/class-names";
import {
  assertHTML,
  assertSelection,
  focusEditor,
  html,
  initialize
} from "../utils";

test.use({ launchOptions: { slowMo: 50 } });

test.describe("composition", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("handles Hiragana characters", async ({ page }) => {
    await page.keyboard.type("も");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">も</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 0, 0],
      focusOffset: 1,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html` <p class="${editorClassNames.paragraph}"><br /></p> `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [0],
      focusOffset: 0,
      focusPath: [0]
    });

    await page.keyboard.type("もじ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">もじ</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });
  });

  test("handles Arabic characters with diacritics", async ({ page }) => {
    await page.keyboard.type("هَ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="rtl">
          <span data-lexical-text="true">ه</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 1,
      anchorPath: [0, 0, 0],
      focusOffset: 1,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html` <p class="${editorClassNames.paragraph}"><br /></p> `
    );

    await page.keyboard.type("هَ");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("ArrowRight");

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });

    await page.keyboard.press("Delete");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 2,
      anchorPath: [0, 0, 0],
      focusOffset: 2,
      focusPath: [0, 0, 0]
    });
  });
});
