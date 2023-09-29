import { Page, test } from "@playwright/test";
import { TEST_ASSET } from "@storiny/ui/src/mocks";

import { EDITOR_CLASSNAMES } from "../../constants";
import { pressBackspace } from "../../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  clearEditor,
  click,
  focusEditor,
  html,
  initialize,
  insert_image
} from "../../utils";

const ROUTE = "*/**/v1/me/assets?page=1";

const assetsRouteHandler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({ json: [TEST_ASSET] });
};

test.describe("image", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
    await page.route(ROUTE, assetsRouteHandler);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, assetsRouteHandler);
  });

  test("can add image nodes and delete them correctly", async ({
    page,
    browserName
  }) => {
    await insert_image(page);

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
              <div data-layout="fit">
                <div
                  aria-expanded="false"
                  aria-haspopup="dialog"
                  type="button"
                  role="button"
                  data-item-container=""
                  data-item-count="1"
                  data-layout="fit"
                  data-state="closed"
                  data-testid="image-node"
                >
                  <div data-index="0">
                    <div>
                      <div data-first-child="">
                        <span>
                          <p>Image not available</p>
                        </span>
                      </div>
                      <button
                        aria-disabled="false"
                        aria-label="Remove image"
                        tabindex="0"
                        title="Remove image"
                        type="button"
                      >
                        <svg aria-hidden="true" viewBox="0 0 12 12">
                          <path
                            d="M2 3.5h8m-5 2v3m2-3v3m-4.5-5 .5 6a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-6m-5 0V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <figcaption data-empty="true">
            <br />
          </figcaption>
        </figure>
        <p><br /></p>
        <p><br /></p>
      `,
      undefined,
      { ignoreClasses: true, ignoreInlineStyles: true }
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [3],
      focusOffset: 0,
      focusPath: [3]
    });

    // Remove image node using backspace

    await focusEditor(page);
    await pressBackspace(page, browserName === "firefox" ? 4 : 3);

    await assertHTML(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [],
      focusOffset: 0,
      focusPath: []
    });

    // Remove image node by selecting the image
    for (const key of ["Backspace", "Delete"]) {
      await focusEditor(page);
      await clearEditor(page);
      await insert_image(page);

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
                <div data-layout="fit">
                  <div
                    aria-expanded="false"
                    aria-haspopup="dialog"
                    type="button"
                    role="button"
                    data-item-container=""
                    data-item-count="1"
                    data-layout="fit"
                    data-state="closed"
                    data-testid="image-node"
                  >
                    <div data-index="0">
                      <div>
                        <div data-first-child="">
                          <span>
                            <p>Image not available</p>
                          </span>
                        </div>
                        <button
                          aria-disabled="false"
                          aria-label="Remove image"
                          tabindex="0"
                          title="Remove image"
                          type="button"
                        >
                          <svg aria-hidden="true" viewBox="0 0 12 12">
                            <path
                              d="M2 3.5h8m-5 2v3m2-3v3m-4.5-5 .5 6a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-6m-5 0V2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <figcaption data-empty="true">
              <br />
            </figcaption>
          </figure>
          <p><br /></p>
          <p><br /></p>
        `,
        undefined,
        { ignoreClasses: true, ignoreInlineStyles: true }
      );

      await click(page, `[data-testid="image-node"]`);
      await page.keyboard.press(key);

      await assertHTML(
        page,
        html`
          <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
          <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
          <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        `
      );
    }
  });
});
