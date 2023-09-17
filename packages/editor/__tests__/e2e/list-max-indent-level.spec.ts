import { test } from "@playwright/test";

import {
  clickIndentButton,
  selectAll,
  toggleBulletedList
} from "../keyboard-shortcuts";
import { assertHTML, focusEditor, html, initialize } from "../utils";

const MAX_INDENT_LEVEL = 2;

test.describe("list indent level", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can only indent until the max depth for an empty list", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await clickIndentButton(page, MAX_INDENT_LEVEL);

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

    await assertHTML(page, expected, undefined, { ignoreClasses: true });
    await clickIndentButton(page, MAX_INDENT_LEVEL, true);
    // Should stay the same
    await assertHTML(page, expected, undefined, { ignoreClasses: true });
  });

  test("can only indent until the max depth for a list having content", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("hello");
    await clickIndentButton(page, MAX_INDENT_LEVEL);

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

    await assertHTML(page, expected, undefined, { ignoreClasses: true });
    await clickIndentButton(page, MAX_INDENT_LEVEL, true);
    // Should stay the same
    await assertHTML(page, expected, undefined, { ignoreClasses: true });
  });

  test("can only indent until the max depth for a list with nested list items", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await page.keyboard.type("Hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");

    await clickIndentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await clickIndentButton(page);

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

    await assertHTML(page, expected, undefined, { ignoreClasses: true });

    await selectAll(page);
    await clickIndentButton(page, MAX_INDENT_LEVEL, true);

    // Should stay the same
    await assertHTML(page, expected, undefined, { ignoreClasses: true });
  });
});
