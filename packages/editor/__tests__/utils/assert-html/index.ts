import { expect, Frame, Page } from "@playwright/test";
import * as prettier from "prettier";

import { sleep } from "../sleep";

/**
 * Calls a function for the specified attempts
 * @param fn Function
 * @param attempts Attempts
 */
const retryAsync = async (
  fn: (...args: any) => any,
  attempts: number
): Promise<void> => {
  while (attempts > 0) {
    let failed = false;

    try {
      await fn();
    } catch (e) {
      if (attempts === 1) {
        throw e;
      }

      failed = true;
    }

    if (!failed) {
      break;
    }

    attempts--;

    await sleep(500);
  }
};

/**
 * Formats an HTML string using prettier
 * @param html HTML string
 * @param ignoreClasses Whether to ignore classes on the elements
 * @param ignoreInlineStyles Whether to ignore inline-styles on the elements
 * @param customIgnorePattern Custom attribute ignore pattern for the elements
 */
const prettifyHTML = async (
  html: string,
  {
    ignoreClasses = false,
    ignoreInlineStyles = false,
    customIgnorePattern
  }: {
    customIgnorePattern?: RegExp;
    ignoreClasses?: boolean;
    ignoreInlineStyles?: boolean;
  } = {}
): Promise<string> => {
  // Remove `data-key` attribute from heading nodes
  let output = html
    .replace(/\sdata-key="(\d+)"/g, "")
    // Replace dynamic ID (generated using React.useId) from radix
    .replace(/([a-zA-Z-_0-9]+)="radix-:(.+):"/g, "");

  if (customIgnorePattern) {
    output = output.replace(customIgnorePattern, "");
  }

  if (ignoreClasses) {
    output = output.replace(/\sclass="([^"]*)"/g, "");
  }

  if (ignoreInlineStyles) {
    output = output.replace(/\sstyle="([^"]*)"/g, "");
  }

  return (
    await prettier.format(
      output,
      Object.assign(
        {
          plugins: ["prettier-plugin-organize-attributes"],
          bracketSameLine: true,
          htmlWhitespaceSensitivity: "ignore",
          parser: "html"
        },
        { attributeGroups: ["$DEFAULT", "^data-"], attributeSort: "ASC" } as any
      )
    )
  ).trim();
};

/**
 * Asserts HTML on iframe
 * @param frame Iframe
 * @param selector Target element selector
 * @param expectedHtml Expected HTML string
 * @param ignoreClasses Whether to ignore classes on the elements
 * @param ignoreInlineStyles Whether to ignore inline-styles on the elements
 * @param customIgnorePattern Custom attribute ignore pattern for the elements
 */
const assertHTMLOnFrame = async (
  frame: Frame | null,
  selector: string,
  expectedHtml: string,
  ignoreClasses: boolean,
  ignoreInlineStyles: boolean,
  customIgnorePattern?: RegExp
): Promise<void> => {
  const actualHtml = await frame!.innerHTML(selector);
  const actual = await prettifyHTML(actualHtml.replace(/\n/gm, ""), {
    ignoreClasses,
    ignoreInlineStyles,
    customIgnorePattern
  });
  const expected = await prettifyHTML(expectedHtml.replace(/\n/gm, ""), {
    ignoreClasses,
    ignoreInlineStyles,
    customIgnorePattern
  });

  expect(actual).toEqual(expected);
};

/**
 * Asserts HTML against both the iframes
 * @param page Page
 * @param expectedHtml Expected HTML string
 * @param expectedHtmlFrameRight Optional expected HTML string for the right frame
 * @param selector Target element selector
 * @param ignoreClasses Whether to ignore classes on the elements
 * @param ignoreInlineStyles Whether to ignore inline-styles on the elements
 * @param customIgnorePattern Custom attribute ignore pattern for the elements
 */
export const assertHTML = async (
  page: Page,
  expectedHtml: string,
  expectedHtmlFrameRight = expectedHtml,
  {
    ignoreClasses = false,
    ignoreInlineStyles = false,
    customIgnorePattern = undefined,
    selector = `div[contenteditable="true"]`
  }: {
    customIgnorePattern?: RegExp;
    ignoreClasses?: boolean;
    ignoreInlineStyles?: boolean;
    selector?: string;
  } = {}
): Promise<void> => {
  const withRetry = async (fn: (...args: any) => any): Promise<void> =>
    await retryAsync(fn, 5);

  await Promise.all([
    withRetry(
      async () =>
        await assertHTMLOnFrame(
          page.frame("left"),
          selector,
          expectedHtml,
          ignoreClasses,
          ignoreInlineStyles,
          customIgnorePattern
        )
    ),
    withRetry(
      async () =>
        await assertHTMLOnFrame(
          page.frame("right"),
          selector,
          expectedHtmlFrameRight,
          ignoreClasses,
          ignoreInlineStyles,
          customIgnorePattern
        )
    )
  ]);
};
