import { test } from "@playwright/test";

import { editorClassNames } from "../constants/class-names";
import { toggleBold, toggleUnderline } from "../keyboard-shortcuts";
import { assertHTML, focusEditor, html, initialize } from "../utils";

const HEADING_HTML = html`
  <h2 class="${editorClassNames.heading}">
    <br />
  </h2>
`;

const SUBHEADING_HTML = html`
  <h3 class="${editorClassNames.subheading}">
    <br />
  </h3>
`;

const HR_HTML = html`
  <hr class="" data-lexical-decorator="true" contenteditable="false" />
  <p class="${editorClassNames.paragraph}"><br /></p>
`;

test.describe("markdown", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focusEditor(page);
  });

  [
    {
      html: HEADING_HTML,
      text: "# "
    },
    {
      html: HEADING_HTML,
      text: "## "
    },
    {
      html: SUBHEADING_HTML,
      text: "### "
    },
    {
      html: SUBHEADING_HTML,
      text: "#### "
    },
    {
      html: SUBHEADING_HTML,
      text: "##### "
    },
    {
      html: SUBHEADING_HTML,
      text: "###### "
    },
    {
      html: html`
        <blockquote class="${editorClassNames.quote}">
          <br />
        </blockquote>
      `,
      text: "> "
    },
    {
      html: html`
        <ol start="321" class="${editorClassNames.ol1}">
          <li value="321" class="${editorClassNames.li}"><br /></li>
        </ol>
      `,
      text: "321. "
    },
    {
      html: HR_HTML,
      text: "*** "
    },
    {
      html: HR_HTML,
      text: "--- "
    },
    {
      html: html`
        <ol class="${editorClassNames.ol1}">
          <li class="${editorClassNames.li}" value="1"><br /></li>
        </ol>
      `,
      text: "1. "
    },
    {
      html: html`
        <ol class="${editorClassNames.ol1}" start="25">
          <li class="${editorClassNames.li}" value="25"><br /></li>
        </ol>
      `,
      text: "25. "
    },
    {
      html: html`
        <ol class="${editorClassNames.ol1}">
          <li class="${editorClassNames.nestedLi}" value="1">
            <ol class="${editorClassNames.ol2}">
              <li class="${editorClassNames.li}" value="1"><br /></li>
            </ol>
          </li>
        </ol>
      `,
      text: "    1. "
    },
    {
      html: html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.li}" value="1"><br /></li>
        </ul>
      `,
      text: "- "
    },
    {
      html: html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.nestedLi}" value="1">
            <ul class="${editorClassNames.ul}">
              <li class="${editorClassNames.li}" value="1"><br /></li>
            </ul>
          </li>
        </ul>
      `,
      text: "    - "
    },
    {
      html: html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.li}" value="1"><br /></li>
        </ul>
      `,
      text: "* "
    },
    {
      html: html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.nestedLi}" value="1">
            <ul class="${editorClassNames.ul}">
              <li class="${editorClassNames.li}" value="1"><br /></li>
            </ul>
          </li>
        </ul>
      `,
      text: "    * "
    },
    {
      html: html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.nestedLi}" value="1">
            <ul class="${editorClassNames.ul}">
              <li class="${editorClassNames.li}" value="1"><br /></li>
            </ul>
          </li>
        </ul>
      `,
      text: "      * "
    },
    {
      html: html`
        <ul class="${editorClassNames.ul}">
          <li class="${editorClassNames.nestedLi}" value="1">
            <ul class="${editorClassNames.ul}">
              <li class="${editorClassNames.nestedLi}" value="1">
                <ul class="${editorClassNames.ul}">
                  <li class="${editorClassNames.li}" value="1">
                    <br />
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      `,
      text: "        * "
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tItalic} ${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            test
          </strong>
          <span data-lexical-text="true"></span>
        </p>
      `,
      text: "~~_**test**_~~ "
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <em
            class="${editorClassNames.tItalic} ${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            test
          </em>
          <span data-lexical-text="true"></span>
        </p>
      `,
      text: "~~_test_~~ "
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            test
          </strong>
          <span data-lexical-text="true"></span>
        </p>
      `,
      text: "~~**test**~~ "
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tItalic}"
            data-lexical-text="true"
          >
            test
          </strong>
          <span data-lexical-text="true"></span>
        </p>
      `,
      text: "_**test**_ "
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: "hello *world*!"
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
          <strong class="${editorClassNames.tBold}" data-lexical-text="true">
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: "hello **world**!"
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tItalic}"
            data-lexical-text="true"
          >
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: "hello ***world***!"
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tItalic}"
            data-lexical-text="true"
          >
            world
          </strong>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: "hello ___world___!"
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <span data-lexical-text="true">hello</span>
          <a
            class="${editorClassNames.link}"
            dir="ltr"
            href="https://storiny.com"
          >
            <span data-lexical-text="true">world</span>
          </a>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: "hello [world](https://storiny.com)!"
    },
    {
      html: html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <em
            class="${editorClassNames.tItalic} ${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            hello world
          </em>
          <span data-lexical-text="true">!</span>
        </p>
      `,
      text: "~~_hello world_~~!"
    }
  ].forEach(({ html, text }) => {
    test(`can import markdown text: ${text}`, async ({ page }) => {
      await page.keyboard.type(text);
      await assertHTML(page, html);
    });
  });

  test("can convert already styled text (overlapping ranges)", async ({
    page
  }) => {
    await toggleBold(page);
    await toggleUnderline(page);

    await page.keyboard.type("h*e~~llo");

    await toggleBold(page);
    await toggleUnderline(page);

    await page.keyboard.type(" wo~~r*ld");

    await assertHTML(
      page,
      html`
        <p class="${editorClassNames.paragraph}" dir="ltr">
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tUnderline}"
            data-lexical-text="true"
          >
            h
          </strong>
          <strong
            class="${editorClassNames.tBold} ${editorClassNames.tItalic} ${editorClassNames.tUnderline}"
            data-lexical-text="true"
          >
            e
          </strong>
          <strong
            class="${editorClassNames.tUnderlineStrikethrough} ${editorClassNames.tBold} ${editorClassNames.tItalic}"
            data-lexical-text="true"
          >
            llo
          </strong>
          <em
            class="${editorClassNames.tItalic} ${editorClassNames.tStrikethrough}"
            data-lexical-text="true"
          >
            wo
          </em>
          <em class="${editorClassNames.tItalic}" data-lexical-text="true">
            r
          </em>
          <span data-lexical-text="true">ld</span>
        </p>
      `
    );
  });
});
