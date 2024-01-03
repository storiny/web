import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  move_left,
  move_to_line_beginning,
  select_all,
  select_characters
} from "../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  key_down_ctrl_or_alt,
  key_up_ctrl_or_alt
} from "../utils";

test.describe("text entry", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can type `hello world` in the editor", async ({ page }) => {
    const target_text = "hello world";
    await page.keyboard.type(target_text);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: target_text.length,
      anchor_path: [0, 0, 0],
      focus_offset: target_text.length,
      focus_path: [0, 0, 0]
    });
  });

  test("can insert text and replace it", async ({ page }) => {
    await page.frame("left")?.locator("[data-lexical-editor]").fill("front");
    await page
      .frame("left")
      ?.locator("[data-lexical-editor]")
      .fill("front updated");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">front updated</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 13,
      anchor_path: [0, 0, 0],
      focus_offset: 13,
      focus_path: [0, 0, 0]
    });
  });

  test("can type `hello` as a header and insert a paragraph before", async ({
    page
  }) => {
    await page.keyboard.type("# hello");

    await move_to_line_beginning(page);

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </h2>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0],
      focus_offset: 0,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}"><br /></h2>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1, 0, 0],
      focus_offset: 0,
      focus_path: [1, 0, 0]
    });
  });

  test("can type `hello world` in the editor and replace it with `foo`", async ({
    page
  }) => {
    const target_text = "hello world";
    await page.keyboard.type(target_text);

    // Select all the text
    await select_all(page);

    await page.keyboard.type("foo");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">foo</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 3,
      anchor_path: [0, 0, 0],
      focus_offset: 3,
      focus_path: [0, 0, 0]
    });
  });

  test("can type `hello world` in the editor and replace it with an empty space", async ({
    page
  }) => {
    const target_text = "hello world";
    await page.keyboard.type(target_text);

    // Select all the text
    await select_all(page);

    await page.keyboard.type(" ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 0, 0],
      focus_offset: 1,
      focus_path: [0, 0, 0]
    });
  });

  test("can handle selection within paragraph", async ({ page }) => {
    await page.keyboard.type("Hello world.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("This is another block.");
    await page.keyboard.down("Shift");
    await move_left(page, 6);

    await assert_selection(page, {
      anchor_offset: 22,
      anchor_path: [1, 0, 0],
      focus_offset: 16,
      focus_path: [1, 0, 0]
    });

    await page.keyboard.up("Shift");
    await page.keyboard.type("paragraph.");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world.</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is another paragraph.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 26,
      anchor_path: [1, 0, 0],
      focus_offset: 26,
      focus_path: [1, 0, 0]
    });
  });

  test("can delete characters after they are typed", async ({ page }) => {
    const text = "Delete some of these characters.";
    const backspaced_text = "Delete some of these characte";

    await page.keyboard.type(text);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Delete some of these characte</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: backspaced_text.length,
      anchor_path: [0, 0, 0],
      focus_offset: backspaced_text.length,
      focus_path: [0, 0, 0]
    });
  });

  test("can type characters, and select & replace a fragment", async ({
    page
  }) => {
    await page.keyboard.type("Hello world.");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world.</span>
        </p>
      `
    );

    await move_left(page, 7);

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0]
    });

    await select_characters(page, "right", 1);

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [0, 0, 0],
      focus_offset: 6,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.type(" my ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello my world.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 9,
      anchor_path: [0, 0, 0],
      focus_offset: 9,
      focus_path: [0, 0, 0]
    });
  });

  test("can select and delete a single word", async ({ page, browserName }) => {
    const text = "Delete some of these characters.";
    const backspaced_text = "Delete some of these ";

    await page.keyboard.type(text);
    await key_down_ctrl_or_alt(page);
    await page.keyboard.down("Shift");

    // Chrome stops words on punctuation, so we need to trigger
    // the left arrow key one more time.
    await move_left(page, browserName === "chromium" ? 2 : 1);
    await page.keyboard.up("Shift");
    await key_up_ctrl_or_alt(page);

    // Ensure the selection is now covering the whole word and period.
    await assert_selection(page, {
      anchor_offset: text.length,
      anchor_path: [0, 0, 0],
      focus_offset: backspaced_text.length,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Delete some of these</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: backspaced_text.length,
      anchor_path: [0, 0, 0],
      focus_offset: backspaced_text.length,
      focus_path: [0, 0, 0]
    });
  });

  test("can handle backspace on the first paragraph", async ({ page }) => {
    // Add some trimmable text
    await page.keyboard.type("  ");

    // Add paragraph
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1],
      focus_offset: 0,
      focus_path: [1]
    });

    // Move to the previous paragraph and press backspace
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });
  });

  test("can handle a combination of paragraphs, break points, and bi-directional text", async ({
    page
  }) => {
    // Add some line breaks
    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
          <br />
          <br />
          <br />
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 3,
      anchor_path: [0],
      focus_offset: 3,
      focus_path: [0]
    });

    // Move to the top
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    // Add a paragraph
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
          <br />
          <br />
          <br />
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1],
      focus_offset: 0,
      focus_path: [1]
    });

    // Handling RTL (bidi) text
    await page.keyboard.press("ArrowUp");
    await page.keyboard.type("هَ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="rtl">
          <span data-lexical-text="true">هَ</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
          <br />
          <br />
          <br />
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });
  });

  test("can select empty paragraph and new line nodes", async ({ page }) => {
    // Add a paragraph
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await page.pause();

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1],
      focus_offset: 0,
      focus_path: [1]
    });

    await page.keyboard.press("ArrowLeft");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    await page.keyboard.press("ArrowRight");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1],
      focus_offset: 0,
      focus_path: [1]
    });

    await page.keyboard.press("ArrowLeft");

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    // Remove the paragraph
    await page.keyboard.press("Delete");

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    // Add line break
    await page.keyboard.down("Shift");
    await page.keyboard.press("Enter");
    await page.keyboard.up("Shift");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
          <br />
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0],
      focus_offset: 1,
      focus_path: [0]
    });

    await page.keyboard.press("ArrowLeft");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <br />
          <br />
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    // Remove line break
    await page.keyboard.press("Delete");

    await assert_html(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });
  });
});
