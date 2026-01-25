import { expect, Frame, Page } from "@playwright/test";
import * as prettier from "prettier";

import { sleep } from "../sleep";

/**
 * Calls a function for the specified attempts
 * @param fn Function
 * @param attempts Attempts
 */
const retry_async = async (
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
 * @param ignore_classes Whether to ignore classes on the elements
 * @param ignore_inline_styles Whether to ignore inline-styles on the elements
 * @param custom_ignore_pattern Custom attribute ignore pattern for the elements
 */
const prettify_html = async (
  html: string,
  {
    ignore_classes = false,
    ignore_inline_styles = false,
    custom_ignore_pattern
  }: {
    custom_ignore_pattern?: RegExp;
    ignore_classes?: boolean;
    ignore_inline_styles?: boolean;
  } = {}
): Promise<string> => {
  // Remove `data-key` attribute from heading nodes
  let output = html
    .replace(/\sdata-key="(\d+)"/g, "")
    // Replace dynamic ID (generated using React.useId) from radix
    .replace(/([a-zA-Z-_0-9]+)="radix-:(.+):"/g, "");

  if (custom_ignore_pattern) {
    output = output.replace(custom_ignore_pattern, "");
  }

  if (ignore_classes) {
    output = output.replace(/\sclass="([^"]*)"/g, "");
  }

  if (ignore_inline_styles) {
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
 * @param expected_html Expected HTML string
 * @param ignore_classes Whether to ignore classes on the elements
 * @param ignore_inline_styles Whether to ignore inline-styles on the elements
 * @param custom_ignore_pattern Custom attribute ignore pattern for the elements
 */
const assert_html_on_frame = async (
  frame: Frame | null,
  selector: string,
  expected_html: string,
  ignore_classes: boolean,
  ignore_inline_styles: boolean,
  custom_ignore_pattern?: RegExp
): Promise<void> => {
  const actual_html = await frame!.innerHTML(selector);
  const actual = await prettify_html(actual_html.replace(/\n/gm, ""), {
    ignore_classes,
    ignore_inline_styles,
    custom_ignore_pattern
  });
  const expected = await prettify_html(expected_html.replace(/\n/gm, ""), {
    ignore_classes,
    ignore_inline_styles,
    custom_ignore_pattern
  });

  expect(actual).toEqual(expected);
};

/**
 * Asserts HTML against both the iframes
 * @param page Page
 * @param expected_html Expected HTML string
 * @param expected_html_frame_right Optional expected HTML string for the right frame
 * @param selector Target element selector
 * @param ignore_classes Whether to ignore classes on the elements
 * @param ignore_inline_styles Whether to ignore inline-styles on the elements
 * @param custom_ignore_pattern Custom attribute ignore pattern for the elements
 */
export const assert_html = async (
  page: Page,
  expected_html: string,
  expected_html_frame_right = expected_html,
  {
    ignore_classes = false,
    ignore_inline_styles = false,
    custom_ignore_pattern = undefined,
    selector = `div[data-editor-content]`
  }: {
    custom_ignore_pattern?: RegExp;
    ignore_classes?: boolean;
    ignore_inline_styles?: boolean;
    selector?: string;
  } = {}
): Promise<void> => {
  const with_retry = async (fn: (...args: any) => any): Promise<void> =>
    await retry_async(fn, 5);

  await Promise.all([
    with_retry(
      async () =>
        await assert_html_on_frame(
          page.frame("left"),
          selector,
          expected_html,
          ignore_classes,
          ignore_inline_styles,
          custom_ignore_pattern
        )
    ),
    with_retry(
      async () =>
        await assert_html_on_frame(
          page.frame("right"),
          selector,
          expected_html_frame_right,
          ignore_classes,
          ignore_inline_styles,
          custom_ignore_pattern
        )
    )
  ]);
};
