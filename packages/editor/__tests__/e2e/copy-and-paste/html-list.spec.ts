import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  click_indent_button,
  click_outdent_button
} from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  paste_from_clipboard
} from "../../utils";

test.describe("html list copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
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
    await paste_from_clipboard(page, clipboard);

    await assert_html(
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

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 5,
      focus_path: [0, 1, 0, 0]
    });

    await click_indent_button(page);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nested_li}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">world</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await click_outdent_button(page);

    await assert_html(
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
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nested_li}">
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
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nested_li}">
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

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 5,
      focus_path: [0, 1, 0, 0]
    });

    await click_indent_button(page);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nested_li}">
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
    await click_outdent_button(page);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nested_li}">
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
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nested_li}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">world</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 1, 0, 0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 1, 0, 0, 0, 0]
    });

    await click_outdent_button(page);

    await assert_html(
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
    await click_indent_button(page);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nested_li}">
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
