import { expect, Page, test } from "@playwright/test";
import { TEST_ASSET } from "@storiny/ui/src/mocks";

import { EDITOR_CLASSNAMES, IS_MAC } from "../constants";
import {
  delete_backward,
  delete_forward,
  move_left,
  move_to_prev_word,
  select_all
} from "../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  evaluate,
  focus_editor,
  html,
  initialize,
  insert_image,
  key_down_ctrl_or_meta,
  key_up_ctrl_or_meta,
  paste_from_clipboard,
  sleep
} from "../utils";

const ROUTE = "*/**/v1/me/assets?page=1";

const assets_route_handler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({ json: [TEST_ASSET] });
};

test.describe("selection", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
    await page.route(ROUTE, assets_route_handler);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, assets_route_handler);
  });

  test("does not focus the editor on load", async ({ page }) => {
    const editor_has_focus = async (): Promise<boolean> =>
      await evaluate(page, () => {
        const editor_element = document.querySelector(
          "div[data-editor-content]"
        );
        return document.activeElement === editor_element;
      });

    await evaluate(page, () => {
      const editor_element = document.querySelector(
        "div[data-editor-content]"
      ) as HTMLElement;
      return editor_element?.blur();
    });

    expect(await editor_has_focus()).toEqual(false);
    await sleep(500);
    expect(await editor_has_focus()).toEqual(false);
  });

  test("can delete text by line using Cmd+Delete (Mac)", async ({ page }) => {
    test.skip(!IS_MAC);

    await page.keyboard.type("One");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Two");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Three");

    const delete_line = async (): Promise<void> => {
      await key_down_ctrl_or_meta(page);
      await page.keyboard.press("Backspace");
      await key_up_ctrl_or_meta(page);
    };

    const lines = [
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">One</span>
        </p>
      `,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Two</span>
        </p>
      `,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Three</span>
        </p>
      `
    ];

    await delete_line();
    await assert_html(page, lines.slice(0, 3).join(""));
    await delete_line();
    await assert_html(page, lines.slice(0, 2).join(""));
    await delete_line();
    await assert_html(page, lines.slice(0, 1).join(""));
    await delete_line();

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );
  });

  test("can insert an inline element within the text and move the selection after it", async ({
    page
  }) => {
    await page.keyboard.type("Hello world");
    await move_to_prev_word(page);
    await paste_from_clipboard(page, {
      "text/html": `<a href="https://example.com">link</a>`
    });
    await sleep(3000);

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 1, 0, 0],
      focus_offset: 4,
      focus_path: [0, 1, 0, 0]
    });
  });

  test("can select everything with node selection", async ({ page }) => {
    await page.keyboard.type("# Text before");
    await insert_image(page);
    await focus_editor(page);
    await page.keyboard.type("Text after");
    await select_all(page);
    await delete_backward(page);

    await assert_html(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );
  });

  test("can delete block elements", async ({ page }) => {
    await page.keyboard.type("# A");
    await page.keyboard.press("Enter");
    await page.keyboard.type("b");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">A</span>
        </h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );

    await move_left(page, 2);
    await delete_backward(page);

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}">
          <br />
        </h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );

    await delete_backward(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );

    await delete_backward(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );
  });

  test("can delete sibling elements forward", async ({ page }) => {
    await page.keyboard.press("Enter");
    await page.keyboard.type("# Title");
    await page.keyboard.press("ArrowUp");

    await sleep(500);
    await delete_forward(page);

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">Title</span>
        </h2>
      `
    );
  });
});
