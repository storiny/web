import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES, IS_WINDOWS } from "../../constants";
import {
  move_left,
  move_to_line_beginning,
  move_to_line_end,
  select_all
} from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  copy_to_clipboard,
  focus_editor,
  html,
  initialize,
  paste_from_clipboard
} from "../../utils";

test.describe("lexical list copy and paste", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can copy and paste partial list items into an empty editor", async ({
    page
  }) => {
    // Add three list items
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    // Add a paragraph
    await page.keyboard.type("Some text.");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [1, 0, 0],
      focus_offset: 10,
      focus_path: [1, 0, 0]
    });

    await page.keyboard.down("Shift");
    await move_to_line_beginning(page);
    await move_left(page, 3);
    await page.keyboard.up("Shift");

    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [1, 0, 0],
      focus_offset: 3,
      focus_path: [0, 2, 0, 0]
    });

    // Copy the partial list item and paragraph
    const clipboard = await copy_to_clipboard(page);
    // Select all and remove content
    await select_all(page);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0],
      focus_offset: 0,
      focus_path: [0]
    });

    // Paste

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">ee</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [1, 0, 0],
      focus_offset: 10,
      focus_path: [1, 0, 0]
    });
  });

  test("can copy and paste partial list items into a list", async ({
    page,
    browserName
  }) => {
    // Add three list items
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    // Add a paragraph
    await page.keyboard.type("Some text.");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [1, 0, 0],
      focus_offset: 10,
      focus_path: [1, 0, 0]
    });

    await page.keyboard.down("Shift");
    await move_to_line_beginning(page);
    await move_left(page, 3);
    await page.keyboard.up("Shift");

    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [1, 0, 0],
      focus_offset: 3,
      focus_path: [0, 2, 0, 0]
    });

    // Copy the partial list item and paragraph
    const clipboard = await copy_to_clipboard(page);
    // Select all and remove content
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    if (!IS_WINDOWS && browserName === "firefox") {
      await page.keyboard.press("ArrowUp");
    }

    await move_to_line_end(page);
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}">
            <br />
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 1],
      focus_offset: 0,
      focus_path: [0, 1]
    });

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">ee</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Some text.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [1, 0, 0],
      focus_offset: 10,
      focus_path: [1, 0, 0]
    });
  });

  test("can copy list items and paste them back a list", async ({ page }) => {
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await move_to_line_beginning(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await move_to_line_end(page);
    await page.keyboard.up("Shift");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 2, 0, 0],
      focus_offset: 4,
      focus_path: [0, 3, 0, 0]
    });

    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}"><br /></li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 2],
      focus_offset: 0,
      focus_path: [0, 2]
    });

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 3, 0, 0],
      focus_offset: 4,
      focus_path: [0, 3, 0, 0]
    });
  });

  test("can copy list items and them paste back into the list on an existing item", async ({
    page
  }) => {
    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await move_to_line_beginning(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await move_to_line_end(page);
    await page.keyboard.up("Shift");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 2, 0, 0],
      focus_offset: 4,
      focus_path: [0, 3, 0, 0]
    });

    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("ArrowRight");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 3, 0, 0],
      focus_offset: 4,
      focus_path: [0, 3, 0, 0]
    });

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">fourthree</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="6" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 4,
      anchor_path: [0, 4, 0, 0],
      focus_offset: 4,
      focus_path: [0, 4, 0, 0]
    });
  });

  test("can copy and paste two paragraphs into a list on an existing item", async ({
    page
  }) => {
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("world");

    await select_all(page);
    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Backspace");

    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");

    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");

    await move_to_line_beginning(page);
    await page.keyboard.press("ArrowDown");
    await move_to_line_end(page);
    await move_left(page, 2);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 3, 0, 0],
      focus_offset: 2,
      focus_path: [0, 3, 0, 0]
    });

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">fohello</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">worldur</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
        </ul>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [1, 0, 0],
      focus_offset: 5,
      focus_path: [1, 0, 0]
    });
  });

  test("can copy and paste two paragraphs at the end of a list", async ({
    page
  }) => {
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("world");

    await select_all(page);
    const clipboard = await copy_to_clipboard(page);
    await page.keyboard.press("Backspace");

    await page.keyboard.type("- one");
    await page.keyboard.press("Enter");
    await page.keyboard.type("two");
    await page.keyboard.press("Enter");
    await page.keyboard.type("three");
    await page.keyboard.press("Enter");
    await page.keyboard.type("four");
    await page.keyboard.press("Enter");
    await page.keyboard.type("five");
    await page.keyboard.press("Enter");

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
          <li value="6" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">world</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [1, 0, 0],
      focus_offset: 5,
      focus_path: [1, 0, 0]
    });

    await paste_from_clipboard(page, clipboard);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">one</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">two</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">three</span>
          </li>
          <li value="4" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">four</span>
          </li>
          <li value="5" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">five</span>
          </li>
          <li value="6" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">worldhello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">world</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 5,
      anchor_path: [2, 0, 0],
      focus_offset: 5,
      focus_path: [2, 0, 0]
    });
  });
});
