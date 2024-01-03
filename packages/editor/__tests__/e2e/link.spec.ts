import { Page, test } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../src/constants/shortcuts";
import { EDITOR_CLASSNAMES } from "../constants";
import {
  delete_backward,
  move_left,
  move_right,
  move_to_line_beginning,
  move_to_line_end,
  press_backspace,
  select_all,
  select_characters,
  toggle_bold,
  toggle_italic,
  toggle_link
} from "../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  click,
  focus_editor,
  html,
  initialize,
  key_down_ctrl_or_alt,
  key_down_ctrl_or_meta,
  key_up_ctrl_or_alt,
  paste_from_clipboard,
  sleep
} from "../utils";

type InsertMethod = "type" | "paste:plain" | "paste:html" | "paste:lexical";

/**
 * Sets the URL of a link node
 * @param page Page
 * @param url URL string
 */
const set_url = async (page: Page, url: string): Promise<void> => {
  await click(page, `button[title="Edit link"]`);
  await press_backspace(page); // Remove `/` from the input
  await page.keyboard.type(url);
  await page.keyboard.press("Enter");
};

test.describe("link", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can convert a text node into a link", async ({ page }) => {
    await page.keyboard.type("Hello");
    await select_all(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
        </p>
      `
    );

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0, 0]
    });

    await select_all(page);
    await set_url(page, "https://storiny.com");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0, 0]
    });

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0],
      focus_offset: 5,
      focus_path: [0, 0, 0]
    });
  });

  test("can convert multi-formatted text into a link (backward)", async ({
    page
  }) => {
    await page.keyboard.type(" abc");

    await toggle_bold(page);
    await page.keyboard.type("def");
    await toggle_bold(page);

    await toggle_italic(page);
    await page.keyboard.type("ghi");
    await toggle_italic(page);

    await page.keyboard.type(" ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">abc</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            def
          </strong>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            ghi
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 3, 0],
      focus_offset: 1,
      focus_path: [0, 3, 0]
    });

    await move_left(page, 1);
    await select_characters(page, "left", 9);

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              def
            </strong>
            <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await set_url(page, "https://storiny.com");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              def
            </strong>
            <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );
  });

  test("can convert multi-formatted text into a link (forward)", async ({
    page
  }) => {
    await page.keyboard.type(" abc");

    await toggle_bold(page);
    await page.keyboard.type("def");
    await toggle_bold(page);

    await toggle_italic(page);
    await page.keyboard.type("ghi");
    await toggle_italic(page);

    await page.keyboard.type(" ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">abc</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            def
          </strong>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            ghi
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 3, 0],
      focus_offset: 1,
      focus_path: [0, 3, 0]
    });

    await move_left(page, 10);
    await select_characters(page, "right", 9);

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              def
            </strong>
            <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await set_url(page, "https://storiny.com");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              def
            </strong>
            <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );
  });

  test("can create a link in a list and insert a paragraph at the start", async ({
    page
  }) => {
    await page.keyboard.type("- hello");
    await select_characters(page, "left", 5);
    await toggle_link(page);
    await move_left(page, 1);

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <a
              class="${EDITOR_CLASSNAMES.link}"
              dir="ltr"
              href="/"
              rel="noreferrer"
            >
              <span data-lexical-text="true">hello</span>
            </a>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
          <li class="${EDITOR_CLASSNAMES.li}" value="2">
            <a
              class="${EDITOR_CLASSNAMES.link}"
              dir="ltr"
              href="/"
              rel="noreferrer"
            >
              <span data-lexical-text="true">hello</span>
            </a>
          </li>
        </ul>
      `
    );
  });

  test("can create a link with some text, insert a paragraph, and then backspace to ensure it merges correctly", async ({
    page
  }) => {
    await page.keyboard.type(" abc def ");
    await move_left(page, 5);
    await select_characters(page, "left", 3);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
          </a>
          <span data-lexical-text="true">def</span>
        </p>
      `
    );

    await move_left(page, 1, 50);
    await move_right(page, 2, 50);
    await sleep(500);
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">ab</span>
          </a>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">c</span>
          </a>
          <span data-lexical-text="true">def</span>
        </p>
      `
    );

    await page.keyboard.press("Backspace");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">ab</span>
          </a>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">c</span>
          </a>
          <span data-lexical-text="true">def</span>
        </p>
      `
    );
  });

  test("can create a link and replace all the characters with plain text", async ({
    page
  }) => {
    await page.keyboard.type(" abc ");
    await move_left(page, 1);
    await select_characters(page, "left", 3);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await page.keyboard.type("a");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can create a link then replace it with plain text", async ({
    page
  }) => {
    await page.keyboard.type(" abc ");
    await move_left(page, 1);
    await select_characters(page, "left", 3);

    await toggle_link(page);

    await select_characters(page, "left", 1);
    await page.keyboard.type("a");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can create a link and partly replace it with plain text", async ({
    page
  }) => {
    await page.keyboard.type(" abc ");
    await move_left(page, 1);
    await select_characters(page, "left", 3);

    await toggle_link(page);

    await select_characters(page, "right", 1);
    await page.keyboard.type("a");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">a</span>
          </a>
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can convert multi-formatted text into a link and modify it afterwards", async ({
    page
  }) => {
    await page.keyboard.type(" abc");

    await toggle_bold(page);
    await page.keyboard.type("def");
    await toggle_bold(page);

    await toggle_italic(page);
    await page.keyboard.type("ghi");
    await toggle_italic(page);

    await page.keyboard.type(" ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">abc</span>
          <strong class="${EDITOR_CLASSNAMES.t_bold}" data-lexical-text="true">
            def
          </strong>
          <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
            ghi
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 3, 0],
      focus_offset: 1,
      focus_path: [0, 3, 0]
    });

    await move_left(page, 1);
    await select_characters(page, "left", 9);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              def
            </strong>
            <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true"></span>
        </p>
      `
    );

    await move_right(page, 1);
    await page.keyboard.type("a");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true"></span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">abc</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              def
            </strong>
            <em class="${EDITOR_CLASSNAMES.t_italic}" data-lexical-text="true">
              ghi
            </em>
          </a>
          <span data-lexical-text="true">a</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 2, 0],
      focus_offset: 1,
      focus_path: [0, 2, 0]
    });
  });

  test("can insert text inside a link after a formatted text node", async ({
    page
  }) => {
    const link_text = "This is the bold link";
    await page.keyboard.type(link_text);

    // Select all characters
    await select_characters(page, "left", link_text.length);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">${link_text}</span>
          </a>
        </p>
      `
    );

    // Move the caret to the end of the link
    await page.keyboard.press("ArrowRight");
    // Move caret to the end of `bold`
    await move_left(page, 5);

    // Select the word `bold`
    await select_characters(page, "left", 4);
    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is the</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              bold
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );

    // Move caret after `bold`
    await page.keyboard.press("ArrowRight");
    // Change word to `boldest`
    await page.keyboard.type("est");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is the</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              boldest
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );
  });

  test("can insert text inside a link before a formatted text node", async ({
    page
  }) => {
    const link_text = "This is a bold link";
    await page.keyboard.type(link_text);

    // Select all characters
    await select_characters(page, "left", link_text.length);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">${link_text}</span>
          </a>
        </p>
      `
    );

    // Move the caret to the end of the link
    await page.keyboard.press("ArrowRight");
    // Move caret to the end of `bold`
    await move_left(page, 5);

    // Select the word `bold`
    await select_characters(page, "left", 4);
    await toggle_bold(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is a</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              bold
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );

    // Move caret to the start of the word `bold`
    await page.keyboard.press("ArrowLeft");
    await select_characters(page, "left", 2);

    // Replace `a ` with `the `
    await page.keyboard.type("the ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">This is the</span>
            <strong
              class="${EDITOR_CLASSNAMES.t_bold}"
              data-lexical-text="true"
            >
              bold
            </strong>
            <span data-lexical-text="true">link</span>
          </a>
        </p>
      `
    );
  });

  test("can edit link with collapsed selection", async ({ page }) => {
    await page.keyboard.type("A link");
    await select_all(page);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">A link</span>
          </a>
        </p>
      `
    );

    await move_to_line_beginning(page);
    await set_url(page, "https://storiny.com");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="https://storiny.com"
            rel="noreferrer"
          >
            <span data-lexical-text="true">A link</span>
          </a>
        </p>
      `
    );
  });

  test("can type text before and after the link", async ({ page }) => {
    await page.keyboard.type("link text");
    await select_all(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">link text</span>
        </p>
      `
    );

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">link text</span>
          </a>
        </p>
      `
    );

    await page.keyboard.press("ArrowLeft");
    await page.keyboard.type("text before link ");
    await move_to_line_end(page);
    await page.keyboard.type(" text after link");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">text before link </span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">link text</span>
          </a>
          <span data-lexical-text="true"> text after link</span>
        </p>
      `
    );
  });

  test("can delete text up to a link and then add text after the it", async ({
    page
  }) => {
    await page.keyboard.type("some random text");
    await move_left(page, 5);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">some random text</span>
        </p>
      `
    );

    await select_characters(page, "left", 6);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">some </span>
          <a
            class="${EDITOR_CLASSNAMES.link}"
            href="/"
            rel="noreferrer"
            dir="ltr"
          >
            <span data-lexical-text="true">random</span>
          </a>
          <span data-lexical-text="true"> text</span>
        </p>
      `
    );

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await delete_backward(page);

    await page.keyboard.type(", ");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">some </span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">random</span>
          </a>
          <span data-lexical-text="true">, text</span>
        </p>
      `
    );
  });

  test("can convert a part of text node into a link with forwards selection", async ({
    page,
    browserName
  }) => {
    await page.keyboard.type("Hello world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </p>
      `
    );

    await move_left(page, 5);
    await select_characters(page, "right", 5);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [0, 1, 0, 0],
        focus_offset: 5,
        focus_path: [0, 1, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 6,
        anchor_path: [0, 0, 0],
        focus_offset: 5,
        focus_path: [0, 1, 0, 0]
      });
    }

    await set_url(page, "https://storiny.com");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [0, 1, 0, 0],
        focus_offset: 5,
        focus_path: [0, 1, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 0,
        anchor_path: [0, 1],
        focus_offset: 5,
        focus_path: [0, 1, 0, 0]
      });
    }

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 0, 0],
      focus_offset: 11,
      focus_path: [0, 0, 0]
    });
  });

  test("can convert a part of text node into a link with backwards selection", async ({
    page,
    browserName
  }) => {
    await page.keyboard.type("Hello world");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </p>
      `
    );

    await select_characters(page, "left", 5);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 1, 0, 0],
        focus_offset: 0,
        focus_path: [0, 1, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 1, 0, 0],
        focus_offset: 6,
        focus_path: [0, 0, 0]
      });
    }

    await set_url(page, "https://storiny.com");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="https://storiny.com"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 1, 0, 0],
        focus_offset: 0,
        focus_path: [0, 1, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 1, 0, 0],
        focus_offset: 0,
        focus_path: [0, 1]
      });
    }

    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello world</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 11,
      anchor_path: [0, 0, 0],
      focus_offset: 6,
      focus_path: [0, 0, 0]
    });
  });

  test("can convert a part of text node into a link and change the node type", async ({
    page
  }) => {
    await page.keyboard.type("Hello world");
    await select_characters(page, "left", 5);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </p>
      `
    );

    await page.keyboard.press("ArrowLeft");

    // Convert to a heading
    await key_down_ctrl_or_meta(page);
    await page.keyboard.down("Shift");
    await page.keyboard.press(EDITOR_SHORTCUTS.heading.key);
    await page.keyboard.up("Shift");
    await key_down_ctrl_or_meta(page);

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">Hello</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">world</span>
          </a>
        </h2>
      `
    );
  });

  test("can create multiline links", async ({ page }) => {
    await page.keyboard.type("Hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Hello world");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Hello world");

    await select_all(page);
    await toggle_link(page);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello world</span>
          </a>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello world</span>
          </a>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello world</span>
          </a>
        </p>
      `
    );
  });

  test("can handle pressing enter inside a link", async ({ page }) => {
    await page.keyboard.type("Hello awesome");

    await select_all(page);
    await toggle_link(page);

    await page.keyboard.press("ArrowRight");
    await page.keyboard.type("world");

    await move_to_line_beginning(page);
    await move_right(page, 6);

    await page.keyboard.press("Enter");
    await sleep(500);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello</span>
          </a>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">awesome</span>
          </a>
          <span data-lexical-text="true">world</span>
        </p>
      `
    );
  });

  test("can handle pressing enter at the beginning of a link", async ({
    page
  }) => {
    await page.keyboard.type("Hello awesome");

    await select_all(page);
    await toggle_link(page);

    await page.keyboard.press("ArrowRight");
    await page.keyboard.type(" world");

    await move_to_line_beginning(page);
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <a
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
            href="/"
            rel="noreferrer"
          >
            <span data-lexical-text="true">Hello awesome</span>
          </a>
          <span data-lexical-text="true">world</span>
        </p>
      `
    );
  });

  test.describe("inserting text on either side of link", () => {
    // In each of the pasting tests, we will paste the letter `x` in a different
    // clipboard data format
    const clipboardData = {
      html: { "text/html": "x" },
      lexical: {
        "application/x-lexical-editor": JSON.stringify({
          namespace: "main",
          nodes: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: "x",
              type: "text",
              version: 1
            }
          ]
        })
      },
      plain: { "text/plain": "x" }
    };

    test.describe("inserting text before the link", () => {
      test.describe("start-of-paragraph link", () => {
        const setup = async (
          page: Page,
          insert_method: InsertMethod
        ): Promise<void> => {
          await focus_editor(page);
          await page.keyboard.type("ab");

          // Turn `a` into a link
          await move_left(page, 1);
          await select_characters(page, "left", 1);
          await toggle_link(page);

          // Insert a character directly before the link
          await move_left(page, 1);

          if (insert_method === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insert_method === "paste:plain"
                ? clipboardData.plain
                : insert_method === "paste:html"
                  ? clipboardData.html
                  : clipboardData.lexical;
            await paste_from_clipboard(page, data);
          }

          // The character should be inserted before the link
          await assert_html(
            page,
            html`
              <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
                <span data-lexical-text="true">x</span>
                <a
                  class="${EDITOR_CLASSNAMES.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">a</span>
                </a>
                <span data-lexical-text="true">b</span>
              </p>
            `
          );
        };

        test("can insert text before a start-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text before a start-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before a start-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before a start-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("mid-paragraph links", () => {
        const setup = async (
          page: Page,
          insert_method: InsertMethod
        ): Promise<void> => {
          await focus_editor(page);
          await page.keyboard.type("abc");

          // Turn `b` into a link
          await move_left(page, 1);
          await select_characters(page, "left", 1);
          await toggle_link(page);

          // Insert a character directly before the link
          await move_left(page, 1);

          if (insert_method === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insert_method === "paste:plain"
                ? clipboardData.plain
                : insert_method === "paste:html"
                  ? clipboardData.html
                  : clipboardData.lexical;
            await paste_from_clipboard(page, data);
          }

          // The character should be inserted before the link
          await assert_html(
            page,
            html`
              <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
                <span data-lexical-text="true">ax</span>
                <a
                  class="${EDITOR_CLASSNAMES.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
                <span data-lexical-text="true">c</span>
              </p>
            `
          );
        };

        test("can insert text before a mid-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text before a mid-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        test("can insert text before a mid-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        test("can insert text before a mid-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("end-of-paragraph links", () => {
        const setup = async (
          page: Page,
          insert_method: InsertMethod
        ): Promise<void> => {
          await focus_editor(page);
          await page.keyboard.type("ab");

          // Turn `b` into a link
          await select_characters(page, "left", 1);
          await toggle_link(page);

          // Insert a character directly before the link
          await move_left(page, 1);
          if (insert_method === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insert_method === "paste:plain"
                ? clipboardData.plain
                : insert_method === "paste:html"
                  ? clipboardData.html
                  : clipboardData.lexical;
            await paste_from_clipboard(page, data);
          }

          // The character should be inserted before the link
          await assert_html(
            page,
            html`
              <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
                <span data-lexical-text="true">ax</span>
                <a
                  class="${EDITOR_CLASSNAMES.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
              </p>
            `
          );
        };

        test("can insert text before an end-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text before an end-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before an end-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text before an end-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });
    });

    test.describe("inserting text after links", () => {
      test.describe("start-of-paragraph links", () => {
        const setup = async (
          page: Page,
          insert_method: InsertMethod
        ): Promise<void> => {
          await focus_editor(page);
          await page.keyboard.type("ab");

          // Turn `a` into a link
          await move_left(page, "b".length);
          await select_characters(page, "left", 1);
          await toggle_link(page);

          // Insert a character directly after the link
          await move_right(page, 1);

          if (insert_method === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insert_method === "paste:plain"
                ? clipboardData.plain
                : insert_method === "paste:html"
                  ? clipboardData.html
                  : clipboardData.lexical;
            await paste_from_clipboard(page, data);
          }

          // The character should be inserted after the link
          await assert_html(
            page,
            html`
              <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
                <a
                  class="${EDITOR_CLASSNAMES.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">a</span>
                </a>
                <span data-lexical-text="true">xb</span>
              </p>
            `
          );
        };

        test("can insert text after a start-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text after a start-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a start-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a start-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("mid-paragraph links", () => {
        const setup = async (
          page: Page,
          insert_method: InsertMethod
        ): Promise<void> => {
          await focus_editor(page);
          await page.keyboard.type("abc");

          // Turn `b` into a link
          await move_left(page, 1);
          await select_characters(page, "left", 1);
          await toggle_link(page);

          // Insert a character directly after the link
          await move_right(page, 1);

          if (insert_method === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insert_method === "paste:plain"
                ? clipboardData.plain
                : insert_method === "paste:html"
                  ? clipboardData.html
                  : clipboardData.lexical;
            await paste_from_clipboard(page, data);
          }

          // The character should be inserted after the link
          await assert_html(
            page,
            html`
              <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
                <span data-lexical-text="true">a</span>
                <a
                  class="${EDITOR_CLASSNAMES.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
                <span data-lexical-text="true">xc</span>
              </p>
            `
          );
        };

        test("can insert text after a mid-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text after a mid-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a mid-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after a mid-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });

      test.describe("end-of-paragraph links", () => {
        const setup = async (
          page: Page,
          insert_method: InsertMethod
        ): Promise<void> => {
          await focus_editor(page);
          await page.keyboard.type("ab");

          // Turn `b` into a link
          await select_characters(page, "left", 1);
          await toggle_link(page);

          // Insert a character directly after the link
          await move_right(page, 1);

          if (insert_method === "type") {
            await page.keyboard.type("x");
          } else {
            const data =
              insert_method === "paste:plain"
                ? clipboardData.plain
                : insert_method === "paste:html"
                  ? clipboardData.html
                  : clipboardData.lexical;
            await paste_from_clipboard(page, data);
          }

          // The character should be inserted after the link
          await assert_html(
            page,
            html`
              <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
                <span data-lexical-text="true">a</span>
                <a
                  class="${EDITOR_CLASSNAMES.link}"
                  dir="ltr"
                  href="/"
                  rel="noreferrer"
                >
                  <span data-lexical-text="true">b</span>
                </a>
                <span data-lexical-text="true">x</span>
              </p>
            `
          );
        };

        test("can insert text after an end-of-paragraph link, via typing", async ({
          page
        }) => {
          await setup(page, "type");
        });

        test("can insert text after an end-of-paragraph link, via pasting plain text", async ({
          page
        }) => {
          await setup(page, "paste:plain");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after an end-of-paragraph link, via pasting HTML", async ({
          page
        }) => {
          await setup(page, "paste:html");
        });

        // TODO: https://github.com/facebook/lexical/issues/4295
        test.skip("can insert text after an end-of-paragraph link, via pasting Lexical text", async ({
          page
        }) => {
          await setup(page, "paste:lexical");
        });
      });
    });
  });
});
