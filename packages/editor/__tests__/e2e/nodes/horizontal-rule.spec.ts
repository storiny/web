import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../../constants";
import {
  move_left,
  move_to_line_beginning,
  press_backspace,
  select_all
} from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  copy_to_clipboard,
  focus_editor,
  html,
  initialize,
  insert_horizontal_rule,
  paste_from_clipboard,
  wait_for_selector
} from "../../utils";

test.describe("horizontal rule", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can create a horizontal rule and move selection around it", async ({
    page,
    browserName
  }) => {
    await insert_horizontal_rule(page);
    await wait_for_selector(page, "hr");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });

    await page.keyboard.press("ArrowUp");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    await page.keyboard.type("Some text");

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });

    await page.keyboard.type("Some more text");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some more text</span>
        </p>
      `
    );

    await move_to_line_beginning(page);

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 9,
        anchor_path: [0, 0, 0],
        focus_offset: 9,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 1,
        anchor_path: [0],
        focus_offset: 1,
        focus_path: [0]
      });
    }

    await press_backspace(page, 10);

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 1,
        anchor_path: [],
        focus_offset: 1,
        focus_path: []
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [],
        focus_offset: 0,
        focus_path: []
      });
    }
  });

  test("adds a horizontal rule at the end of the current text node and moves the selection to the new paragraph node", async ({
    page
  }) => {
    await page.keyboard.type("Test");

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 0, 0],
      focus_offset: 4,
      focus_path: [0, 0, 0]
    });

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Test</span>
        </p>
      `
    );

    await insert_horizontal_rule(page);
    await wait_for_selector(page, "hr");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Test</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });
  });

  test("adds a horizontal rule and splits a text node across 2 paragraphs if the caret is in the middle of the text node, moving the selection to the start of the new paragraph node", async ({
    page
  }) => {
    await page.keyboard.type("Test");

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 0, 0],
      focus_offset: 4,
      focus_path: [0, 0, 0]
    });

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Test</span>
        </p>
      `
    );

    await move_left(page, 2);

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });

    await insert_horizontal_rule(page);
    await wait_for_selector(page, "hr");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Te</span>
        </p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">st</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2, 0, 0],
      focus_offset: 0,
      focus_path: [2, 0, 0]
    });
  });

  test("can copy and paste a horizontal rule", async ({ page }) => {
    await insert_horizontal_rule(page);
    await wait_for_selector(page, "hr");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });

    // Select all the text, copy it and delete it
    await select_all(page);
    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Backspace");

    // Paste it again
    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Backspace");

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <hr class="" contenteditable="false" data-lexical-decorator="true" />
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2],
      focus_offset: 0,
      focus_path: [2]
    });
  });
});
