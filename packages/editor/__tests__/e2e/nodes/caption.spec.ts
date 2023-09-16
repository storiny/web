import { Page, test } from "@playwright/test";
import { compressToEncodedURIComponent } from "lz-string";

import { moveLeft, pressBackspace } from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  focusEditor,
  html,
  initialize,
  insertEmbed
} from "../../utils";

const EMBED_SLUG = compressToEncodedURIComponent("https://example.com");
const ROUTE = `*/**/embed/${EMBED_SLUG}?theme={light,dark}`;

/**
 * Returns embed response without iframe
 * @param route Route
 */
const sourcedEmbedHandler: Parameters<Page["route"]>[1] = async (route) => {
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

    await page.route(ROUTE, sourcedEmbedHandler);

    await insertEmbed(page);
    await focusEditor(page);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, sourcedEmbedHandler);
  });

  test("can add caption node along with the figure node", async ({ page }) => {
    await assertHTML(
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
        ignoreClasses: true,
        ignoreInlineStyles: true
      }
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [3],
      focusOffset: 0,
      focusPath: [3]
    });
  });

  test("can type inside the caption node", async ({ page }) => {
    await pressBackspace(page, 2);
    await page.keyboard.type("text inside caption");

    await assertHTML(
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
        ignoreClasses: true,
        ignoreInlineStyles: true
      }
    );

    await assertSelection(page, {
      anchorOffset: 19,
      anchorPath: [1, 1, 0, 0],
      focusOffset: 19,
      focusPath: [1, 1, 0, 0]
    });
  });

  test("can split into a paragraph node and move out of the figure element when enter is pressed in-between the caption", async ({
    page
  }) => {
    await pressBackspace(page, 2);
    await page.keyboard.type("text inside caption");
    await moveLeft(page, 8);

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    await new Promise(() => {});

    await assertHTML(
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
        <p><span data-lexical-text="true"> caption</span></p>
      `,
      undefined,
      {
        ignoreClasses: true,
        ignoreInlineStyles: true
      }
    );

    await assertSelection(page, {
      anchorOffset: 19,
      anchorPath: [1, 1, 0, 0],
      focusOffset: 19,
      focusPath: [1, 1, 0, 0]
    });
  });
});
