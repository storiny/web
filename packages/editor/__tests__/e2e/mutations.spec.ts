import { Page, test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import { toggleCode } from "../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  evaluate,
  focusEditor,
  html,
  initialize
} from "../utils";

/**
 * Validates mutated content
 * @param page Page
 */
const validateContent = async (page: Page): Promise<void> => {
  await assertHTML(
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

  await assertSelection(page, {
    anchorOffset: 4,
    anchorPath: [0, 1, 0, 0],
    focusOffset: 4,
    focusPath: [0, 1, 0, 0]
  });
};

test.describe("mutations", () => {
  test.beforeEach(({ page }) => initialize(page));

  test("can restore the DOM to the editor state", async ({ page }) => {
    await focusEditor(page);
    await page.keyboard.type("hello world ");
    await toggleCode(page);
    await page.keyboard.type("#000");

    await validateContent(page);

    // Remove the paragraph
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const paragraph = rootElement?.firstChild;
      paragraph?.remove();
    });
    await validateContent(page);

    // Remove the paragraph content
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const paragraph = rootElement?.firstChild;

      if (paragraph) {
        paragraph.textContent = "";
      }
    });
    await validateContent(page);

    // Remove the first child node
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const firstNode = rootElement?.firstChild?.firstChild;
      firstNode?.remove();
    });
    await validateContent(page);

    // Remove the first child node's content
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const firstNode = rootElement?.firstChild?.firstChild;

      if (firstNode) {
        firstNode.textContent = "";
      }
    });
    await validateContent(page);

    // Move last node to first
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const paragraph = rootElement?.firstChild;
      const textNode = paragraph?.firstChild!;
      const codeNode = textNode?.nextSibling!;
      paragraph?.insertBefore(codeNode, textNode);
    });
    await validateContent(page);

    // Add additional nodes to the root
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const span = document.createElement("span");
      const anotherSpan = document.createElement("span");
      const text = document.createTextNode("123");

      rootElement?.appendChild(span);
      rootElement?.appendChild(anotherSpan);
      rootElement?.appendChild(text);
    });
    await validateContent(page);

    // Add additional nodes to the paragraph
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const paragraph = rootElement?.firstChild;
      const firstNode = paragraph?.firstChild!;

      const span = document.createElement("span");
      const anotherSpan = document.createElement("span");
      const text = document.createTextNode("123");

      paragraph?.appendChild(span);
      paragraph?.appendChild(text);
      paragraph?.insertBefore(anotherSpan, firstNode);
    });
    await validateContent(page);

    // Add additional nodes to the text ndoe
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const paragraph = rootElement?.firstChild;
      const firstNode = paragraph?.firstChild;

      const span = document.createElement("span");
      const text = document.createTextNode("123");

      firstNode?.appendChild(span);
      firstNode?.appendChild(text);
    });
    await validateContent(page);

    // Replace text nodes
    await evaluate(page, () => {
      const rootElement = document.querySelector(`div[contenteditable="true"]`);
      const paragraph = rootElement?.firstChild;
      const firstNode = paragraph?.firstChild;
      const text = document.createTextNode("123");
      firstNode?.replaceWith(text);
    });
    await validateContent(page);
  });
});
