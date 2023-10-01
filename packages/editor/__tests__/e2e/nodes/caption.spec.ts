import { Page, test } from "@playwright/test";
import { compressToEncodedURIComponent as compress_to_encoded_uri_component } from "lz-string";

import {
  move_left,
  move_to_paragraph_beginning,
  press_backspace
} from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  insert_embed,
  sleep
} from "../../utils";

const EMBED_SLUG = compress_to_encoded_uri_component("https://example.com");
const ROUTE = `*/**/embed/${EMBED_SLUG}?theme={light,dark}`;

/**
 * Returns embed response without iframe
 * @param route Route
 */
const sourced_embed_handler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({
    json: {
      html: "<span></span>",
      sources: [],
      embed_type: "sourced_oembed",
      supports_binary_theme: false
    }
  });
};

test.describe("caption", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await page.route(ROUTE, sourced_embed_handler);
    await insert_embed(page);
    await focus_editor(page);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, sourced_embed_handler);
  });

  test("can add caption node along with the figure node", async ({ page }) => {
    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption data-empty="true"><br /></figcaption>
        </figure>
        <p><br /></p>
        <p><br /></p>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [3],
      focus_offset: 0,
      focus_path: [3]
    });
  });

  test("can type inside the caption node", async ({ page }) => {
    await press_backspace(page, 2);
    await page.keyboard.type("text inside caption");

    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption dir="ltr" data-empty="false">
            <span data-lexical-text="true">text inside caption</span>
          </figcaption>
        </figure>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await assert_selection(page, {
      anchor_offset: 19,
      anchor_path: [1, 1, 0, 0],
      focus_offset: 19,
      focus_path: [1, 1, 0, 0]
    });
  });

  test("can split into a paragraph node and move out of the figure element when enter is pressed in-between the caption", async ({
    page
  }) => {
    await press_backspace(page, 2);
    await page.keyboard.type("text inside caption");
    await move_left(page, 8);

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await sleep(500);

    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption dir="ltr" data-empty="false">
            <span data-lexical-text="true">text inside</span>
          </figcaption>
        </figure>
        <p><br /></p>
        <p dir="ltr"><span data-lexical-text="true">caption</span></p>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [3, 0, 0],
      focus_offset: 0,
      focus_path: [3, 0, 0]
    });
  });

  test("can merge with other text nodes", async ({ page }) => {
    await press_backspace(page, 2);
    await page.keyboard.type("text inside caption");
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption dir="ltr" data-empty="false">
            <span data-lexical-text="true">text inside caption</span>
          </figcaption>
        </figure>
        <p><br /></p>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await page.keyboard.type("hello world");

    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption dir="ltr" data-empty="false">
            <span data-lexical-text="true">text inside caption</span>
          </figcaption>
        </figure>
        <p dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    await move_to_paragraph_beginning(page);
    await page.keyboard.type(" ");
    await move_left(page, 1);
    await press_backspace(page);

    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption dir="ltr" data-empty="false">
            <span data-lexical-text="true"
              >text inside caption hello world</span
            >
          </figcaption>
        </figure>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );
  });

  test("can delete the entire figure node when backspace is pressed at the start of the caption node", async ({
    page
  }) => {
    await press_backspace(page, 2);
    await page.keyboard.type("caption");

    await assert_html(
      page,
      html`
        <p><br /></p>
        <figure data-testid="figure-node">
          <div
            contenteditable="false"
            data-lexical-decorator="true"
            data-testid="block-node"
          >
            <div>
              <div data-layout="fill" data-testid="embed-node">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  role="button"
                  type="button"
                  data-layout="fill"
                  data-loading="false"
                  data-state="closed"
                >
                  <span></span>
                </div>
              </div>
              <div aria-hidden="true"></div>
            </div>
          </div>
          <figcaption dir="ltr" data-empty="false">
            <span data-lexical-text="true">caption</span>
          </figcaption>
        </figure>
      `,
      undefined,
      {
        ignore_classes: true,
        ignore_inline_styles: true
      }
    );

    // Move to the start of the caption node
    await move_left(page, 7);
    await press_backspace(page);
    await sleep(500);

    await assert_html(page, html`<p><br /></p>`, undefined, {
      ignore_classes: true
    });
  });
});
