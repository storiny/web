import { test } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../../src/constants/shortcuts";
import { EDITOR_CLASSNAMES } from "../../constants";
import { move_left, press_backspace } from "../../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  focus_editor,
  html,
  initialize,
  key_down_ctrl_or_meta,
  key_up_ctrl_or_meta
} from "../../utils";

test.describe("tk", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can mark a paragraph with TK", async ({ page }) => {
    await page.keyboard.type("This is a paragraph");

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 19,
      anchor_path: [0, 0, 0],
      focus_offset: 19,
      focus_path: [0, 0, 0]
    });

    await page.keyboard.type(" with TK");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 1, 0],
      focus_offset: 2,
      focus_path: [0, 1, 0]
    });
  });

  test("can remove TK with a single backspace (token mode)", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with TK");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 1, 0],
      focus_offset: 2,
      focus_path: [0, 1, 0]
    });

    await press_backspace(page, 7);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 19,
      anchor_path: [0, 0, 0],
      focus_offset: 19,
      focus_path: [0, 0, 0]
    });
  });

  test("paragraph can handle more than one TK nodes", async ({ page }) => {
    await page.keyboard.type(
      "This is a paragraph with many TK nodes. They look like TK, smell like TK, and work like TK."
    );

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with many</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">nodes. They look like</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">, smell like</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">, and work like</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 8, 0],
      focus_offset: 1,
      focus_path: [0, 8, 0]
    });
  });

  test("removing a single TK from a paragraph having mutliple TK nodes should not alter its class", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 4, 0],
      focus_offset: 1,
      focus_path: [0, 4, 0]
    });

    await press_backspace(page, 15);

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 1, 0],
      focus_offset: 2,
      focus_path: [0, 1, 0]
    });
  });

  test("can remove multiple TK nodes", async ({ page }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 4, 0],
      focus_offset: 1,
      focus_path: [0, 4, 0]
    });

    await press_backspace(page, 24);

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 19,
      anchor_path: [0, 0, 0],
      focus_offset: 19,
      focus_path: [0, 0, 0]
    });
  });

  test("can split into multiple nodes when enter is pressed between at-least two TK nodes", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 1,
      anchor_path: [0, 4, 0],
      focus_offset: 1,
      focus_path: [0, 4, 0]
    });

    await move_left(page, 12);
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and</span>
        </p>
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true"> another</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
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

  test("can merge with paragraphs already having TK nodes", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with a TK and another TK.");

    await move_left(page, 12);
    await page.keyboard.press("Enter");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and</span>
        </p>
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true"> another</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [1, 0, 0],
      focus_offset: 0,
      focus_path: [1, 0, 0]
    });

    await press_backspace(page);

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with a</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">and another</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
          <span data-lexical-text="true">.</span>
        </p>
      `
    );
  });

  test("can only be a direct child of a paragraph node", async ({ page }) => {
    await page.keyboard.type("### This is a heading with a TK");

    await assert_html(
      page,
      html`
        <h3 class="${EDITOR_CLASSNAMES.subheading}" dir="ltr">
          <span data-lexical-text="true">This is a heading with a TK</span>
        </h3>
      `
    );
  });

  test("can transform into a text node when the parent paragraph node gets transformed", async ({
    page
  }) => {
    await page.keyboard.type("This is a paragraph with TK");

    await assert_html(
      page,
      html`
        <p
          class="${EDITOR_CLASSNAMES.paragraph} ${EDITOR_CLASSNAMES.tk_paragraph}"
          dir="ltr"
        >
          <span data-lexical-text="true">This is a paragraph with</span>
          <span
            class="${EDITOR_CLASSNAMES.tk}"
            spellcheck="false"
            data-lexical-text="true"
            >TK</span
          >
        </p>
      `
    );

    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 1, 0],
      focus_offset: 2,
      focus_path: [0, 1, 0]
    });

    // Convert to a heading
    await key_down_ctrl_or_meta(page);
    await page.keyboard.press(EDITOR_SHORTCUTS.heading.key);
    await key_up_ctrl_or_meta(page);

    await assert_html(
      page,
      html`
        <h2 class="${EDITOR_CLASSNAMES.heading}" dir="ltr">
          <span data-lexical-text="true">This is a paragraph with TK</span>
        </h2>
      `
    );

    await assert_selection(page, {
      anchor_offset: 27,
      anchor_path: [0, 0, 0],
      focus_offset: 27,
      focus_path: [0, 0, 0]
    });
  });
});
