import { test } from "@playwright/test";

import {
  click_indent_button,
  select_all,
  toggle_bulleted_list
} from "../keyboard-shortcuts";
import { assert_html, focus_editor, html, initialize } from "../utils";

const MAX_INDENT_LEVEL = 2;

test.describe("list indent level", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can only indent until the max depth for an empty list", async ({
    page
  }) => {
    await toggle_bulleted_list(page);
    await click_indent_button(page, MAX_INDENT_LEVEL);

    const expected = html`
      <ul>
        <li value="1">
          <ul>
            <li value="1">
              <ul>
                <li value="1">
                  <br />
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `;

    await assert_html(page, expected, undefined, { ignore_classes: true });
    await click_indent_button(page, MAX_INDENT_LEVEL, true);
    // Should stay the same
    await assert_html(page, expected, undefined, { ignore_classes: true });
  });

  test("can only indent until the max depth for a list having content", async ({
    page
  }) => {
    await toggle_bulleted_list(page);
    await page.keyboard.type("hello");
    await click_indent_button(page, MAX_INDENT_LEVEL);

    const expected = html`
      <ul>
        <li value="1">
          <ul>
            <li value="1">
              <ul>
                <li dir="ltr" value="1">
                  <span data-lexical-text="true">hello</span>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `;

    await assert_html(page, expected, undefined, { ignore_classes: true });
    await click_indent_button(page, MAX_INDENT_LEVEL, true);
    // Should stay the same
    await assert_html(page, expected, undefined, { ignore_classes: true });
  });

  test("can only indent until the max depth for a list with nested list items", async ({
    page
  }) => {
    await toggle_bulleted_list(page);

    await page.keyboard.type("Hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");

    await click_indent_button(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await click_indent_button(page);

    await page.keyboard.press("Enter");

    const expected = html`
      <ul>
        <li dir="ltr" value="1">
          <span data-lexical-text="true">Hello</span>
        </li>
        <li dir="ltr" value="2">
          <span data-lexical-text="true">from</span>
        </li>
        <li value="3">
          <ul>
            <li dir="ltr" value="1">
              <span data-lexical-text="true">the</span>
            </li>
            <li dir="ltr" value="2">
              <span data-lexical-text="true">other</span>
            </li>
            <li value="3">
              <ul>
                <li dir="ltr" value="1">
                  <span data-lexical-text="true">side</span>
                </li>
                <li value="2"><br /></li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `;

    await assert_html(page, expected, undefined, { ignore_classes: true });
    await select_all(page);
    await click_indent_button(page, MAX_INDENT_LEVEL, true);
    // Should stay the same
    await assert_html(page, expected, undefined, { ignore_classes: true });
  });
});
