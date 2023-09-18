import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  clickIndentButton,
  clickOutdentButton
} from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  focusEditor,
  html,
  initialize,
  pasteFromClipboard
} from "../../utils";

test.describe("html list copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can copy and paste a list element", async ({ page }) => {
    const clipboard = {
      "text/html": html`
        <ul>
          <li>hello</li>
          <li>world</li>
        </ul>
      `
    };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">world</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 5,
      focusPath: [0, 1, 0, 0]
    });

    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">world</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">world</span>
          </li>
        </ul>
      `
    );
  });

  test("can copy and paste a nested list", async ({ page }) => {
    const clipboard = {
      "text/html": html`
        <ul>
          <li>hello</li>
          <li>
            <ul>
              <li>awesome</li>
            </ul>
          </li>
          <li>world</li>
        </ul>
      `
    };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">awesome</span>
              </li>
            </ul>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">world</span>
          </li>
        </ul>
      `
    );
  });

  test("can copy and paste a nested list with a directly nested unordered list", async ({
    page
  }) => {
    const clipboard = {
      "text/html": html`
        <ul>
          <ul>
            <li>hello</li>
          </ul>
          <li>world</li>
        </ul>
      `
    };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">hello</span>
              </li>
            </ul>
          </li>
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">world</span>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0, 0],
      focusOffset: 5,
      focusPath: [0, 1, 0, 0]
    });

    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">hello</span>
              </li>
              <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">world</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("ArrowUp");
    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">world</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );
  });

  test("can copy and paste a nested list with non-list content and an unordered list child", async ({
    page
  }) => {
    const clipboard = {
      "text/html": html`
        <ul>
          <li>
            hello
            <ul>
              <li>world</li>
            </ul>
          </li>
        </ul>
      `
    };
    await pasteFromClipboard(page, clipboard);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">world</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await assertSelection(page, {
      anchorOffset: 5,
      anchorPath: [0, 1, 0, 0, 0, 0],
      focusOffset: 5,
      focusPath: [0, 1, 0, 0, 0, 0]
    });

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">world</span>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("ArrowUp");
    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">hello</span>
              </li>
            </ul>
          </li>
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">world</span>
          </li>
        </ul>
      `
    );
  });
});
