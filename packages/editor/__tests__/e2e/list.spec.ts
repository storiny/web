import { Page, test } from "@playwright/test";

import { EDITOR_SHORTCUTS } from "../../src/constants/shortcuts";
import { EDITOR_CLASSNAMES } from "../constants";
import {
  clickIndentButton,
  clickOutdentButton,
  moveLeft,
  moveToParagraphEnd,
  selectAll,
  selectCharacters,
  toggleBulletedList,
  toggleLink,
  toggleNumberedList
} from "../keyboard-shortcuts";
import {
  assertHTML,
  assertSelection,
  clearEditor,
  focusEditor,
  html,
  initialize,
  keyDownCtrlOrMeta,
  keyUpCtrlOrMeta
} from "../utils";

/**
 * Converts the curernt node selection to paragraph
 * @param page Page
 */
const convertToParagraph = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.down("Alt");
  await page.keyboard.press(EDITOR_SHORTCUTS.paragraph.key);
  await page.keyboard.up("Alt");
  await keyUpCtrlOrMeta(page);
};

test.describe("list", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  test("can toggle an empty list on/off", async ({ page }) => {
    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );
  });

  test("can create a list and indent/outdent it", async ({ page }) => {
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
        </ul>
      `
    );

    // Should allow indenting an empty list item
    await clickIndentButton(page, 2);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="1">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="1">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" value="1">
                    <br />
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    // Backspace should "unindent" the first list item
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
        </ul>
      `
    );

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("should outdent if previously indented when the backspace key is pressed", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");

    await clickIndentButton(page, 2);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.nestedLi}">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li value="1" class="${EDITOR_CLASSNAMES.li}">
                    <br />
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("Backspace");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}"><br /></li>
            </ul>
          </li>
        </ul>
      `
    );
  });

  test("can indent/outdent mutliple list nodes in a list with multiple levels of indentation", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}"><br /></li>
        </ul>
      `
    );

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");

    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">from</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await selectAll(page);
    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">hello</span>
              </li>
              <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                    <span data-lexical-text="true">from</span>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">from</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">from</span>
              </li>
              <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">the</span>
              </li>
              <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await selectAll(page);
    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">hello</span>
              </li>
              <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                    <span data-lexical-text="true">from</span>
                  </li>
                  <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                    <span data-lexical-text="true">the</span>
                  </li>
                  <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                    <span data-lexical-text="true">other</span>
                  </li>
                </ul>
              </li>
              <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">side</span>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">from</span>
              </li>
              <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">the</span>
              </li>
              <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("can indent a list with a list item in between nested lists", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("foo");
    await clickIndentButton(page);
    await page.keyboard.press("Enter");
    await page.keyboard.type("bar");
    await clickOutdentButton(page);
    await page.keyboard.press("Enter");
    await page.keyboard.type("baz");
    await clickIndentButton(page);

    await selectAll(page);
    await clickIndentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="1">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="1">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
                    <span data-lexical-text="true">foo</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
                <span data-lexical-text="true">bar</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
                    <span data-lexical-text="true">baz</span>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `
    );
  });

  test("can create a list and toggle it back to its original state", async ({
    page
  }) => {
    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await page.keyboard.type("hello");
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
      `
    );

    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">from</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">the</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">other</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">side</span>
        </p>
      `
    );

    await selectAll(page);
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">from</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">the</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">other</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">side</span>
        </p>
      `
    );

    // Check for an indented list
    await toggleBulletedList(page);
    await clickIndentButton(page, 2);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="1">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="1">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">hello</span>
                  </li>
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                    <span data-lexical-text="true">from</span>
                  </li>
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
                    <span data-lexical-text="true">the</span>
                  </li>
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
                    <span data-lexical-text="true">other</span>
                  </li>
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
                    <span data-lexical-text="true">side</span>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">from</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">the</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">other</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">side</span>
        </p>
      `
    );
  });

  test("can create a list containing inline blocks and toggle it back to its original state", async ({
    page
  }) => {
    await assertHTML(
      page,
      html`<p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>`
    );

    await page.keyboard.type("One two three");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">One two three</span>
        </p>
      `
    );

    await moveLeft(page, 6);
    await selectCharacters(page, "left", 3);
    await toggleLink(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">One</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">two</span>
          </a>
          <span data-lexical-text="true">three</span>
        </p>
      `
    );

    // Move to the end of the paragraph to close the floating link popover
    await moveToParagraphEnd(page);
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">One </span>
            <a
              href="/"
              rel="noreferrer"
              class="${EDITOR_CLASSNAMES.link}"
              dir="ltr"
            >
              <span data-lexical-text="true">two</span>
            </a>
            <span data-lexical-text="true"> three</span>
          </li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">One</span>
          <a
            href="/"
            rel="noreferrer"
            class="${EDITOR_CLASSNAMES.link}"
            dir="ltr"
          >
            <span data-lexical-text="true">two</span>
          </a>
          <span data-lexical-text="true">three</span>
        </p>
      `
    );
  });

  test("can create mutliple bullet lists and toggle off the list", async ({
    page
  }) => {
    await assertHTML(
      page,
      html` <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p> `
    );

    await page.keyboard.type("hello");

    await toggleBulletedList(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("from");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    await page.keyboard.type("the");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");

    await page.keyboard.type("other");

    await toggleBulletedList(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">the</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await selectAll(page);
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">from</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">the</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">other</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">side</span>
        </p>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="3"><br /></li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="5"><br /></li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="6">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="7">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("can create an unordered list and convert it to an ordered list", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
        </ul>
      `
    );

    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
        </ol>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1"><br /></li>
        </ul>
      `
    );
  });

  test("can create an unordered list with a single text item and convert it to an ordered list", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("hello");
    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
        </ol>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
        </ul>
      `
    );
  });

  test("can create a multi-line unordered list and convert it to an ordered list", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
            <span data-lexical-text="true">side</span>
          </li>
        </ol>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("can create a multi-line unordered list and convert it to an ordered list when no nodes are in the selection", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="5"><br /></li>
        </ul>
      `
    );

    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="5"><br /></li>
        </ol>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="5"><br /></li>
        </ul>
      `
    );
  });

  test("can create an indented multi-line unordered list and convert it to an ordered list", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");

    await clickIndentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("the");

    await clickIndentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("other");

    await clickOutdentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await selectAll(page);
    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ol class="${EDITOR_CLASSNAMES.ol2}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ol class="${EDITOR_CLASSNAMES.ol3}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ol>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ol>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ol>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("can create an indented multi-line unordered list and convert individual lists in the nested structure to numbered lists", async ({
    page
  }) => {
    await toggleBulletedList(page);

    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");

    await clickIndentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("the");

    await clickIndentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("other");

    await clickOutdentButton(page);

    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await clickOutdentButton(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ol>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    // Move to the next item up in the list
    await page.keyboard.press("ArrowUp");
    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ol class="${EDITOR_CLASSNAMES.ol2}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ol>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    // Move to the next item up in the list
    await page.keyboard.press("ArrowUp");
    await toggleNumberedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ol class="${EDITOR_CLASSNAMES.ol3}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ol>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );

    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                <span data-lexical-text="true">from</span>
              </li>
              <li class="${EDITOR_CLASSNAMES.nestedLi}" value="2">
                <ul class="${EDITOR_CLASSNAMES.ul}">
                  <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
                    <span data-lexical-text="true">the</span>
                  </li>
                </ul>
              </li>
              <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
                <span data-lexical-text="true">other</span>
              </li>
            </ul>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("can merge selected nodes into existing list siblings of the same type when formatting to a list", async ({
    page
  }) => {
    // hello
    // - from
    // the
    // - other
    // side
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");

    await toggleBulletedList(page);

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");

    await toggleBulletedList(page);

    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("side");

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">from</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">the</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">other</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">side</span>
        </p>
      `
    );

    await selectAll(page);
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="3">
            <span data-lexical-text="true">the</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="4">
            <span data-lexical-text="true">other</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="5">
            <span data-lexical-text="true">side</span>
          </li>
        </ul>
      `
    );
  });

  test("should not merge selected nodes into existing list siblings of a different type when formatting to a list", async ({
    page
  }) => {
    // - hello
    // - from
    // the
    await toggleBulletedList(page);
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await toggleNumberedList(page);

    // - hello
    // - from
    // 1. the
    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">from</span>
          </li>
        </ul>
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">the</span>
          </li>
        </ol>
      `
    );

    await clearEditor(page);

    // hello
    // 1. from
    // 2. the
    await page.keyboard.type("hello");
    await page.keyboard.press("Enter");
    await toggleNumberedList(page);
    await page.keyboard.type("from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("the");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await toggleNumberedList(page);

    // 1. hello
    // 2. from
    // 3. the
    await assertHTML(
      page,
      html`
        <ol class="${EDITOR_CLASSNAMES.ol1}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">hello</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">from</span>
          </li>
          <li value="3" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">the</span>
          </li>
        </ol>
      `
    );
  });

  test("can create list with start number markdown", async ({ page }) => {
    // Trigger markdown using 321 digits followed by a period and a trigger of space
    await page.keyboard.type("321. ");

    await assertHTML(
      page,
      html`
        <ol start="321" class="${EDITOR_CLASSNAMES.ol1}">
          <li value="321" class="${EDITOR_CLASSNAMES.li}"><br /></li>
        </ol>
      `
    );
  });

  test("should not process paragraph markdown inside list", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("# ");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}">
            <span data-lexical-text="true"># </span>
          </li>
        </ul>
      `
    );
  });

  test("un-indents empty list items when the user presses enter", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("a");
    await page.keyboard.press("Enter");
    await clickIndentButton(page);
    await clickIndentButton(page);
    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.nestedLi}">
            <ul class="${EDITOR_CLASSNAMES.ul}">
              <li value="1" class="${EDITOR_CLASSNAMES.li}"><br /></li>
            </ul>
          </li>
        </ul>
      `
    );

    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
          <li value="2" class="${EDITOR_CLASSNAMES.li}"><br /></li>
        </ul>
      `
    );

    await page.keyboard.press("Enter");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li value="1" class="${EDITOR_CLASSNAMES.li}" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );
  });

  test("can convert a list with a single item to a paragraph when the text style is changed", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("a");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
        </ul>
      `
    );

    await convertToParagraph(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">a</span>
        </p>
      `
    );
  });

  test("can convert the last item in a list with multiple items to a paragraph when the text style is changed", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("a");
    await page.keyboard.press("Enter");
    await page.keyboard.type("b");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="2" dir="ltr">
            <span data-lexical-text="true">b</span>
          </li>
        </ul>
      `
    );

    await convertToParagraph(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
      `
    );
  });

  test("can convert the middle item in a list with multiple items to a paragraph when the text style is changed", async ({
    page
  }) => {
    await toggleBulletedList(page);
    await page.keyboard.type("a");
    await page.keyboard.press("Enter");
    await page.keyboard.type("b");
    await page.keyboard.press("Enter");
    await page.keyboard.type("c");
    await page.keyboard.press("ArrowUp");

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="2" dir="ltr">
            <span data-lexical-text="true">b</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" value="3" dir="ltr">
            <span data-lexical-text="true">c</span>
          </li>
        </ul>
      `
    );

    await convertToParagraph(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
            <span data-lexical-text="true">a</span>
          </li>
        </ul>
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">b</span>
        </p>
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" value="1" dir="ltr">
            <span data-lexical-text="true">c</span>
          </li>
        </ul>
      `
    );
  });

  test("can replace existing element nodes", async ({ page }) => {
    // Create two quote nodes, select them, and format thme to a list.
    // It should replace quotes nodes (instead of moving them into the list items)
    await page.keyboard.type("> hello from");
    await page.keyboard.press("Enter");
    await page.keyboard.type("> the other side");

    await selectAll(page);
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <ul class="${EDITOR_CLASSNAMES.ul}">
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="1">
            <span data-lexical-text="true">hello from</span>
          </li>
          <li class="${EDITOR_CLASSNAMES.li}" dir="ltr" value="2">
            <span data-lexical-text="true">the other side</span>
          </li>
        </ul>
      `
    );
  });

  test("can remove list breaks when the selection is inside an empty nested list item", async ({
    page
  }) => {
    await page.keyboard.type("hello world");
    await page.keyboard.press("Enter");

    await toggleBulletedList(page);
    await clickIndentButton(page);
    await toggleBulletedList(page);

    await assertHTML(
      page,
      html`
        <p class="${EDITOR_CLASSNAMES.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello world</span>
        </p>
        <p class="${EDITOR_CLASSNAMES.paragraph}"><br /></p>
      `
    );

    await assertSelection(page, {
      anchorOffset: 0,
      anchorPath: [1],
      focusOffset: 0,
      focusPath: [1]
    });
  });
});
