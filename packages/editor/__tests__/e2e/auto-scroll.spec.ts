import { expect, Page, test } from "@playwright/test";

import { evaluate, focusEditor, initialize } from "../utils";

test.describe("auto-scroll while typing", () => {
  test.beforeEach(({ page }) => initialize(page));

  /**
   * Makes an element scrollable
   * @param page Page
   * @param selector Selector
   */
  const addScroll = async (page: Page, selector: string): Promise<void> => {
    await evaluate(
      page,
      (selector) => {
        const element = document.querySelector(selector) as HTMLElement | null;

        if (element) {
          element.style.overflow = "auto";
          element.style.maxHeight = "200px";
        }
      },
      selector
    );
  };

  /**
   * Predicate function for determining whether the caret is visible
   * @param page Page
   * @param selector Selector
   */
  const isCaretVisible = async (
    page: Page,
    selector: string
  ): Promise<boolean> =>
    await evaluate(
      page,
      (selector) => {
        const selection = document.getSelection();
        const range = selection?.getRangeAt(0);
        const element = document.createElement("span");

        element.innerHTML = "|";
        range?.insertNode(element);

        const selectionRect = element.getBoundingClientRect();
        element.parentNode?.removeChild(element);

        const containerRect = document
          .querySelector(selector)
          ?.getBoundingClientRect() || { top: 0, bottom: 0 };

        return (
          selectionRect.top >= containerRect.top &&
          selectionRect.top < containerRect.bottom
        );
      },
      selector
    );

  [
    [
      "can auto-scroll if the content editable element is scrollable",
      `div[contenteditable="true"]`
    ],
    [
      "can auto-scroll if the parent element is scrollable",
      `[data-testid="editor-container"]`
    ]
  ].forEach(async ([name, selector]) => {
    test(name, async ({ page }) => {
      await focusEditor(page);
      await addScroll(page, selector);

      for (let i = 0; i < 15; i++) {
        await page.keyboard.type("Hello");
        await page.keyboard.press("Enter");

        expect(await isCaretVisible(page, selector)).toBe(true);
      }
    });
  });
});
