import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import { assertHTML, evaluate, focusEditor, html, initialize } from "../utils";

test.describe("events", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("autocapitalization (MacOS specific)", async ({ page }) => {
    await page.keyboard.type("i");
    await evaluate(page, () => {
      const editable = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      const span = editable.querySelector("span");

      if (!span) {
        return;
      }

      const textNode = span.firstChild;
      const singleRangeFn =
        (
          startContainer: Node,
          startOffset: number,
          endContainer: Node,
          endOffset: number
        ) =>
        (): [StaticRange] =>
          [
            new StaticRange({
              endContainer,
              endOffset,
              startContainer,
              startOffset
            })
          ];

      if (!textNode) {
        return;
      }

      const character = "S"; // S for space because the space itself gets trimmed in the assertHTML
      const replacementCharacter = "I";
      const dataTransfer = new DataTransfer();

      dataTransfer.setData("text/plain", replacementCharacter);
      dataTransfer.setData("text/html", replacementCharacter);

      const characterBeforeInputEvent = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        data: character,
        inputType: "insertText"
      });

      characterBeforeInputEvent.getTargetRanges = singleRangeFn(
        textNode,
        1,
        textNode,
        1
      );

      const replacementBeforeInputEvent = new InputEvent(
        "beforeinput",
        Object.assign(
          {
            bubbles: true,
            cancelable: true,
            data: replacementCharacter,
            dataTransfer,
            inputType: "insertReplacementText"
          },
          {
            clipboardData: dataTransfer
          }
        )
      );

      replacementBeforeInputEvent.getTargetRanges = singleRangeFn(
        textNode,
        0,
        textNode,
        1
      );

      const characterInputEvent = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        data: character,
        inputType: "insertText"
      });

      editable.dispatchEvent(characterBeforeInputEvent);
      textNode.textContent += character;
      editable.dispatchEvent(replacementBeforeInputEvent);
      editable.dispatchEvent(characterInputEvent);
    });

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">IS</span>
        </p>
      `
    );
  });
});
