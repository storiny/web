import { Page, test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import { toggle_code } from "../keyboard-shortcuts";
import {
  assert_html,
  assert_selection,
  evaluate,
  focus_editor,
  html,
  initialize
} from "../utils";

/**
 * Validates mutated content
 * @param page Page
 */
const validate_content = async (page: Page): Promise<void> => {
  await assert_html(
    page,
    html`
      <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
        <span data-lexical-text="true">hello world</span>
        <code spellcheck="false" data-lexical-text="true">
          <span class="${EDITOR_CLASSNAMES.color}" style="--color: #000">
            #000
          </span>
        </code>
      </p>
    `
  );

  await assert_selection(page, {
    anchor_offset: 4,
    anchor_path: [0, 1, 0, 0],
    focus_offset: 4,
    focus_path: [0, 1, 0, 0]
  });
};

test.describe("mutations", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("can restore the DOM to the editor state", async ({ page }) => {
    await focus_editor(page);
    await page.keyboard.type("hello world ");
    await toggle_code(page);
    await page.keyboard.type("#000");

    await validate_content(page);

    // Remove the paragraph
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const paragraph = root_element?.firstChild;
      paragraph?.remove();
    });
    await validate_content(page);

    // Remove the paragraph content
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const paragraph = root_element?.firstChild;

      if (paragraph) {
        paragraph.textContent = "";
      }
    });
    await validate_content(page);

    // Remove the first child node
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const first_node = root_element?.firstChild?.firstChild;
      first_node?.remove();
    });
    await validate_content(page);

    // Remove the first child node's content
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const first_node = root_element?.firstChild?.firstChild;

      if (first_node) {
        first_node.textContent = "";
      }
    });
    await validate_content(page);

    // Move last node to first
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const paragraph = root_element?.firstChild;
      const text_node = paragraph?.firstChild!;
      const code_node = text_node?.nextSibling!;
      paragraph?.insertBefore(code_node, text_node);
    });
    await validate_content(page);

    // Add additional nodes to the root
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const span = document.createElement("span");
      const another_span = document.createElement("span");
      const text = document.createTextNode("123");

      root_element?.appendChild(span);
      root_element?.appendChild(another_span);
      root_element?.appendChild(text);
    });
    await validate_content(page);

    // Add additional nodes to the paragraph
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const paragraph = root_element?.firstChild;
      const first_node = paragraph?.firstChild!;

      const span = document.createElement("span");
      const another_span = document.createElement("span");
      const text = document.createTextNode("123");

      paragraph?.appendChild(span);
      paragraph?.appendChild(text);
      paragraph?.insertBefore(another_span, first_node);
    });
    await validate_content(page);

    // Add additional nodes to the text ndoe
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const paragraph = root_element?.firstChild;
      const first_node = paragraph?.firstChild;

      const span = document.createElement("span");
      const text = document.createTextNode("123");

      first_node?.appendChild(span);
      first_node?.appendChild(text);
    });
    await validate_content(page);

    // Replace text nodes
    await evaluate(page, () => {
      const root_element = document.querySelector(
        `div[contenteditable="true"]`
      );
      const paragraph = root_element?.firstChild;
      const first_node = paragraph?.firstChild;
      const text = document.createTextNode("123");
      first_node?.replaceWith(text);
    });
    await validate_content(page);
  });
});
