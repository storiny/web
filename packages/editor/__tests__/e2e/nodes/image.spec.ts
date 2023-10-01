import { Page, test } from "@playwright/test";
import { TEST_ASSET } from "@storiny/ui/src/mocks";

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
  insert_image
} from "../../utils";

const ROUTE = "*/**/v1/me/assets?page=1";

const assets_route_handler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({ json: [TEST_ASSET] });
};

test.describe("image", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
    await page.route(ROUTE, assets_route_handler);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, assets_route_handler);
  });

  test("can add image nodes and delete them correctly", async ({
    page,
    browserName
  }) => {
    await insert_image(page);

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
      { ignore_classes: true, ignore_inline_styles: true }
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [3],
      focus_offset: 0,
      focus_path: [3]
    });

    // Remove image node using backspace

    await focus_editor(page);
    await press_backspace(page, browserName === "firefox" ? 4 : 3);

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [],
      focus_offset: 0,
      focus_path: []
    });

    // Remove image node by selecting the image
    for (const key of ["Backspace", "Delete"]) {
      await focus_editor(page);
      await clear_editor(page);
      await insert_image(page);

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
        { ignore_classes: true, ignore_inline_styles: true }
      );

      await click(page, `[data-testid="image-node"]`);
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
});
