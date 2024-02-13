import { Page, test } from "@playwright/test";
import { MOCK_USERS } from "@storiny/ui/src/mocks";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  wait_for_selector
} from "../../utils";

const ROUTE = "*/**/v1/me/lookup/username?query=user";

const lookup_route_handler: Parameters<Page["route"]>[1] = async (route) => {
  await route.fulfill({
    json: MOCK_USERS.slice(0, 5).map((user, index) => ({
      ...user,
      username: `user-${index + 1}`
    }))
  });
};

test.describe("mention", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
    await page.route(ROUTE, lookup_route_handler);
  });

  test.afterEach(async ({ page }) => {
    await page.unroute(ROUTE, lookup_route_handler);
  });

  test("can mention a user", async ({ page }) => {
    await focus_editor(page);
    await page.keyboard.type("@user");
    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0]
    });

    await wait_for_selector(page, '#typeahead-menu ul li:has-text("user-1")');
    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">@user</span>
        </p>
      `
    );

    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <a
            class="${EDITOR_CLASSNAMES.mention}"
            style="font-size: calc(0.9em)"
            data-mention="true"
            data-lexical-text="true"
            href="/user-1"
            >@user-1</a
          >
        </p>
      `
    );
    await assert_selection(page, {
      anchor_offset: 7,
      anchor_path: [0, 0, 0],
      focus_offset: 7,
      focus_path: [0, 0, 0]
    });
  });
});
