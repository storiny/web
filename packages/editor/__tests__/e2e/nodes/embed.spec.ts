import { Page, test } from "@playwright/test";
import { compressToEncodedURIComponent as compress_to_encoded_uri_component } from "lz-string";

import { EDITOR_CLASSNAMES } from "../../constants";
import { press_backspace } from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  clear_editor,
  click,
  focus_editor,
  html,
  initialize,
  insert_embed,
  wait_for_selector
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
      html: "<blockquote>Test embed</blockquote>",
      sources: [
        "http://localhost:0000/script_a.js",
        "http://localhost:0000/script_b.js"
      ],
      embed_type: "sourced_oembed",
      supports_binary_theme: false
    }
  });
};

/**
 * Returns embed response with iframe
 * @param route
 */
const iframe_embed_handler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({
    body: html`
      <!doctype html>
      <html data-theme="light" lang="en">
        <head>
          <meta charset="utf-8" />
          <title>test</title>
        </head>
        <body dir="ltr">
          <div style="--padding-bottom:50%">
            <iframe src="https://example.com" loading="lazy"></iframe>
          </div>
        </body>
        <script type="application/storiny.embed.rich+json">
          ${JSON.stringify({
            sources: [],
            provider: "test",
            styles: "--padding-desktop:50.00%",
            embed_type: "rich",
            supports_binary_theme: false
          })}
        </script>
      </html>
    `
  });
};

/**
 * Returns a webpage metadata response
 * @param route Route
 */
const webpage_metadata_handler: Parameters<Page["route"]>[1] = async (
  route
) => {
  await route.fulfill({
    json: {
      embed_type: "metadata",
      title: "Test title",
      host: "Test site",
      url: "https://example.com",
      description: "Test description",
      image: {
        src: "https://media.example.com/some.jpg",
        width: 640,
        height: 320,
        alt: "Some alt text",
        is_large: true
      },
      favicon: "https://example.com/favicon.ico"
    }
  });
};

test.describe("embed", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE);
  });

  test("can add embed nodes and delete them correctly", async ({
    page,
    browserName
  }) => {
    await page.route(ROUTE, sourced_embed_handler);
    await insert_embed(page);

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
                  <blockquote>Test embed</blockquote>
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

    // Remove embed node using backspace

    await focus_editor(page);
    await press_backspace(page, browserName === "firefox" ? 4 : 3);

    await assert_html(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [],
      focus_offset: 0,
      focus_path: []
    });

    // Remove embed node by selecting the node
    for (const key of ["Backspace", "Delete"]) {
      await focus_editor(page);
      await clear_editor(page);
      await insert_embed(page);

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
                    <blockquote>Test embed</blockquote>
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
        { ignore_classes: true, ignore_inline_styles: true }
      );

      await click(page, `[data-testid="embed-node"]`);
      await page.keyboard.press(key);

      await assert_html(
        page,
        html`
          <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
          <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
          <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        `
      );
    }
  });

  test("can render a `sourced_oembed` type", async ({ page }) => {
    await page.route(ROUTE, sourced_embed_handler);
    await insert_embed(page);

    // Scripts should get appended to the document
    await wait_for_selector(
      page,
      `script[src="http://localhost:0000/script_a.js"]`,
      { state: "attached" }
    );
    await wait_for_selector(
      page,
      `script[src="http://localhost:0000/script_b.js"]`,
      { state: "attached" }
    );

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
                  <blockquote>Test embed</blockquote>
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

  test("can render an embed with iframe", async ({ page }) => {
    await page.route(ROUTE, iframe_embed_handler);
    await insert_embed(page);

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
                  <iframe loading="lazy"></iframe>
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
        ignore_inline_styles: true,
        custom_ignore_pattern: /\ssrc="([^"]*)"/g // Remove the `src` attribute from the iframe as it can change depending on the theme
      }
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [3],
      focus_offset: 0,
      focus_path: [3]
    });
  });

  test("can render a webpage metadata", async ({ page }) => {
    await page.route(ROUTE, webpage_metadata_handler);
    await insert_embed(page);

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
                <div data-layout="fill">
                  <div>
                    <div>
                      <div>
                        <span><span>TT</span></span>
                        <span>
                          Test title
                          <span>example.com</span>
                        </span>
                      </div>
                      <span aria-hidden="true"></span>
                      <a
                        aria-disabled="false"
                        href="https://example.com"
                        rel="noreferrer"
                        role="button"
                        tabindex="0"
                        target="_blank"
                        title="https://example.com"
                      >
                        <svg aria-hidden="true" viewBox="0 0 12 12">
                          <path
                            d="M6 3H3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V6m-3.5.5L10 2m0 0H7.5M10 2v2.5"
                          ></path>
                        </svg>
                      </a>
                    </div>
                    <a
                      href="https://example.com"
                      rel="noreferrer"
                      target="_blank"
                      title="https://example.com"
                    >
                      <div>
                        <div data-first-child="">
                          <span><p>Image not available</p></span>
                        </div>
                      </div>
                    </a>
                    <div><p>Test description</p></div>
                  </div>
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
});
