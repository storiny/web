import { test } from "@playwright/test";

import { EDITOR_CLASSNAMES } from "../constants";
import {
  assert_html,
  evaluate,
  focus_editor,
  html,
  initialize
} from "../utils";

test.describe("events", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
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

      const text_node = span.firstChild;
      const single_range_fn =
        /* eslint-disable prefer-snakecase/prefer-snakecase */

        (
            startContainer: Node,
            startOffset: number,
            endContainer: Node,
            endOffset: number
          ) =>
          (): [StaticRange] => [
            new StaticRange({
              endContainer,
              endOffset,
              startContainer,
              startOffset
            })
            /* eslint-enable prefer-snakecase/prefer-snakecase */
          ];

      if (!text_node) {
        return;
      }

      const character = "S"; // S for space because the space itself gets trimmed in the assert_html
      const replacement_character = "I";
      const dataTransfer = new DataTransfer();

      dataTransfer.setData("text/plain", replacement_character);
      dataTransfer.setData("text/html", replacement_character);

      const character_before_input_event = new InputEvent("beforeinput", {
        bubbles: true,
        cancelable: true,
        data: character,
        inputType: "insertText"
      });

      character_before_input_event.getTargetRanges = single_range_fn(
        text_node,
        1,
        text_node,
        1
      );

      const replacement_before_input_event = new InputEvent(
        "beforeinput",
        Object.assign(
          {
            bubbles: true,
            cancelable: true,
            data: replacement_character,
            dataTransfer,
            inputType: "insertReplacementText"
          },
          {
            clipboardData: dataTransfer
          }
        )
      );

      replacement_before_input_event.getTargetRanges = single_range_fn(
        text_node,
        0,
        text_node,
        1
      );

      const character_input_event = new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        data: character,
        inputType: "insertText"
      });

      editable.dispatchEvent(character_before_input_event);
      text_node.textContent += character;
      editable.dispatchEvent(replacement_before_input_event);
      editable.dispatchEvent(character_input_event);
    });

    await assert_html(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">IS</span>
        </p>
      `
    );
  });
});
