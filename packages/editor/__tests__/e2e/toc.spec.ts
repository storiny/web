import { test } from "@playwright/test";

import {
  assert_html,
  clear_editor,
  focus_editor,
  html,
  initialize
} from "../utils";

const TOC_SELECTOR = `[data-testid="toc"]`;

test.describe("table of contents", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("has an `Empty` label when the editor is empty", async ({ page }) => {
    await assert_html(
      page,
      html`
        <div>
          <p>Empty</p>
        </div>
      `,
      undefined,
      {
        selector: TOC_SELECTOR,
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );
  });

  test("can update when a heading is typed into the editor and the editor is cleared afterwards", async ({
    page
  }) => {
    await page.keyboard.type("# hello");

    await assert_html(
      page,
      html`
        <div>
          <ul>
            <li role="button" tabindex="0" title="hello">
              <span>hello</span>
            </li>
          </ul>
        </div>
      `,
      undefined,
      {
        selector: TOC_SELECTOR,
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await clear_editor(page);

    await assert_html(
      page,
      html`
        <div>
          <p>Empty</p>
        </div>
      `,
      undefined,
      {
        selector: TOC_SELECTOR,
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );
  });

  test("can handle headings with subheadings", async ({ page }) => {
    await page.keyboard.type("# hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("### smaller");
    await page.keyboard.press("Enter");
    await page.keyboard.type("### heading");
    await page.keyboard.press("Enter");
    await page.keyboard.type("### node");
    await page.keyboard.press("Enter");
    await page.keyboard.type("## world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("### another");
    await page.keyboard.press("Enter");
    await page.keyboard.type("### heading");

    await assert_html(
      page,
      html`
        <div>
          <ul>
            <li role="button" tabindex="0" title="hello"><span>hello</span></li>
            <li role="button" tabindex="0" title="smaller">
              <span>smaller</span>
            </li>
            <li role="button" tabindex="0" title="heading">
              <span>heading</span>
            </li>
            <li role="button" tabindex="0" title="node"><span>node</span></li>
            <li role="button" tabindex="0" title="world"><span>world</span></li>
            <li role="button" tabindex="0" title="another">
              <span>another</span>
            </li>
            <li role="button" tabindex="0" title="heading">
              <span>heading</span>
            </li>
          </ul>
        </div>
      `,
      undefined,
      {
        selector: TOC_SELECTOR,
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await clear_editor(page);

    await assert_html(
      page,
      html`
        <div>
          <p>Empty</p>
        </div>
      `,
      undefined,
      {
        selector: TOC_SELECTOR,
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );
  });

  test("can handle direct subheadings", async ({ page }) => {
    await page.keyboard.type("### hello");

    await assert_html(
      page,
      html`
        <div>
          <ul>
            <li role="button" tabindex="0" title="hello">
              <span>hello</span>
            </li>
          </ul>
        </div>
      `,
      undefined,
      {
        selector: TOC_SELECTOR,
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );
  });
});
