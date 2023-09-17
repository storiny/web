import { expect, Frame, Locator, Page } from "@playwright/test";
import { nanoid } from "nanoid";
import { PageFunction } from "playwright-core/types/structs";
import * as prettier from "prettier";

import { selectAll } from "../keyboard-shortcuts";

export const E2E_PORT = process.env.E2E_PORT || 3000;
export const E2E_BROWSER = process.env.E2E_BROWSER;
export const IS_MAC = process.platform === "darwin";
export const IS_WINDOWS = process.platform === "win32";
export const IS_LINUX = !IS_MAC && !IS_WINDOWS;

export const initialize = async (page: Page): Promise<void> => {
  const url = `http://localhost:${E2E_PORT}/split/?collab_id=${nanoid()}`;

  await page.setViewportSize({ height: 1000, width: 3000 });
  await page.goto(url);
  await exposeLexicalEditor(page);
};

const exposeLexicalEditor = async (page: Page): Promise<void> => {
  await page.frame("left")?.evaluate(() => {
    (window as any).lexicalEditor = (
      document.querySelector(`[data-lexical-editor="true"]`) as any
    )?.__lexicalEditor;
  });
};

export const repeat = async (
  times: number,
  cb: () => Promise<void>
): Promise<void> => {
  for (let i = 0; i < times; i++) {
    await cb();
  }
};

export const clickSelectors = async (
  page: Page,
  selectors: string[]
): Promise<void> => {
  for (let i = 0; i < selectors.length; i++) {
    await click(page, selectors[i]);
  }
};

const assertHTMLOnFrame = async (
  frame: Frame | null,
  expectedHtml: string,
  ignoreClasses: boolean,
  ignoreInlineStyles: boolean,
  customIgnorePattern?: RegExp
): Promise<void> => {
  const actualHtml = await frame!.innerHTML('div[contenteditable="true"]');
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

export const assertHTML = async (
  page: Page,
  expectedHtml: string,
  expectedHtmlFrameRight = expectedHtml,
  {
    ignoreClasses = false,
    ignoreInlineStyles = false,
    customIgnorePattern = undefined
  }: {
    customIgnorePattern?: RegExp;
    ignoreClasses?: boolean;
    ignoreInlineStyles?: boolean;
  } = {}
): Promise<void> => {
  const withRetry = async (fn: (...args: any) => any): Promise<void> =>
    await retryAsync(fn, 5);

  await Promise.all([
    withRetry(
      async () =>
        await assertHTMLOnFrame(
          page.frame("left"),
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
          expectedHtmlFrameRight,
          ignoreClasses,
          ignoreInlineStyles,
          customIgnorePattern
        )
    )
  ]);
};

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

export const assertSelection = async (
  page: Page,
  expected: {
    anchorOffset: number | number[];
    anchorPath: number[];
    focusOffset: number | number[];
    focusPath: number[];
  }
): Promise<void> => {
  const frame = page.frame("left");

  if (!frame) {
    return;
  }

  // Assert the selection of the editor matches the snapshot
  const selection = await frame.evaluate(() => {
    const rootElement = document.querySelector('div[contenteditable="true"]');

    const getPathFromNode = (node: Node | null): number[] => {
      const path: number[] = [];

      if (node === rootElement) {
        return [];
      }

      while (node !== null) {
        const parent = node.parentNode;

        if (parent === null || node === rootElement) {
          break;
        }

        path.push(
          Array.from(parent.childNodes).indexOf(
            node as (typeof parent.childNodes)[number]
          )
        );
        node = parent;
      }

      return path.reverse();
    };

    const { anchorNode, anchorOffset, focusNode, focusOffset } =
      window.getSelection()!;

    return {
      anchorOffset,
      anchorPath: getPathFromNode(anchorNode),
      focusOffset,
      focusPath: getPathFromNode(focusNode)
    };
  }, expected);

  expect(selection.anchorPath).toEqual(expected.anchorPath);
  expect(selection.focusPath).toEqual(expected.focusPath);

  if (Array.isArray(expected.anchorOffset)) {
    const [start, end] = expected.anchorOffset;

    expect(selection.anchorOffset).toBeGreaterThanOrEqual(start);
    expect(selection.anchorOffset).toBeLessThanOrEqual(end);
  } else {
    expect(selection.anchorOffset).toEqual(expected.anchorOffset);
  }

  if (Array.isArray(expected.focusOffset)) {
    const [start, end] = expected.focusOffset;

    expect(selection.focusOffset).toBeGreaterThanOrEqual(start);
    expect(selection.focusOffset).toBeLessThanOrEqual(end);
  } else {
    expect(selection.focusOffset).toEqual(expected.focusOffset);
  }
};

export const isMac = async (page: Page): Promise<boolean> =>
  page.evaluate(
    () =>
      typeof window !== "undefined" &&
      /Mac|iPod|iPhone|iPad/.test(window.navigator.platform)
  );

export const supportsBeforeInput = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    if ("InputEvent" in window) {
      return "getTargetRanges" in new window.InputEvent("input");
    }

    return false;
  });

export const keyDownCtrlOrMeta = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.down("Meta");
  } else {
    await page.keyboard.down("Control");
  }
};

export const keyUpCtrlOrMeta = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.up("Control");
  }
};

export const keyDownCtrlOrAlt = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.down("Alt");
  } else {
    await page.keyboard.down("Control");
  }
};

export const keyUpCtrlOrAlt = async (page: Page): Promise<void> => {
  if (await isMac(page)) {
    await page.keyboard.up("Alt");
  } else {
    await page.keyboard.up("Control");
  }
};

export const copyToClipboard = async (
  page: Page
): Promise<Record<string, string>> =>
  await page.frame("left")!.evaluate(() => {
    const clipboardData: Record<string, string> = {};
    const editor = document.querySelector('div[contenteditable="true"]');
    const copyEvent = new ClipboardEvent("copy");

    Object.defineProperty(copyEvent, "clipboardData", {
      value: {
        setData: (type: string, value: string) => {
          clipboardData[type] = value;
        }
      }
    });

    editor?.dispatchEvent(copyEvent);
    return clipboardData;
  });

export const pasteFromClipboard = async (
  page: Page,
  clipboardData: Record<string, string>
): Promise<void> => {
  const canUseBeforeInput = supportsBeforeInput(page);

  await page.frame("left")!.evaluate(
    async ({
      clipboardData: _clipboardData,
      canUseBeforeInput: _canUseBeforeInput
    }) => {
      const files: File[] = [];

      for (const [clipboardKey, clipboardValue] of Object.entries(
        _clipboardData
      )) {
        if (clipboardKey.startsWith("playwright/base64")) {
          delete _clipboardData[clipboardKey];

          const [base64, type] = clipboardValue;
          const res = await fetch(base64);
          const blob = await res.blob();

          files.push(new File([blob], "file", { type }));
        }
      }

      let eventClipboardData: {
        files: File[];
        getData: (type: string) => string;
        types: string[];
      };

      if (files.length > 0) {
        eventClipboardData = {
          files,
          getData: (type) => _clipboardData[type],
          types: [...Object.keys(_clipboardData), "Files"]
        };
      } else {
        eventClipboardData = {
          files,
          getData: (type) => _clipboardData[type],
          types: Object.keys(_clipboardData)
        };
      }

      const editor = document.querySelector('div[contenteditable="true"]');
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true
      });

      Object.defineProperty(pasteEvent, "clipboardData", {
        value: eventClipboardData
      });

      editor?.dispatchEvent(pasteEvent);

      if (!pasteEvent.defaultPrevented) {
        if (await _canUseBeforeInput) {
          const inputEvent = new InputEvent("beforeinput", {
            bubbles: true,
            cancelable: true
          });

          Object.defineProperty(inputEvent, "inputType", {
            value: "insertFromPaste"
          });
          Object.defineProperty(inputEvent, "dataTransfer", {
            value: eventClipboardData
          });

          editor?.dispatchEvent(inputEvent);
        }
      }
    },
    { canUseBeforeInput, clipboardData }
  );
};

export const sleep = async (delay: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, delay));
};

// Fair time for the browser to process a newly inserted image
export const sleepInsertImage = async (count = 1): Promise<void> =>
  await sleep(1000 * count);

export const focusEditor = async (page: Page): Promise<void> => {
  const selector = 'div[contenteditable="true"]';
  await page.waitForSelector('iframe[name="left"]');
  const leftFrame = page.frame("left");

  if (!leftFrame) {
    return;
  }

  if (leftFrame.locator('[data-testid="overlay"]')) {
    await leftFrame.waitForSelector('[data-testid="overlay"]', {
      state: "detached"
    });

    await sleep(500);
  }

  await leftFrame.focus(selector);
};

export const getHTML = async (
  page: Page,
  selector = 'div[contenteditable="true"]'
): Promise<string> => {
  const element = page.frame("left")?.locator(selector);
  return (await element?.innerHTML()) || "";
};

export const getEditorElement = (
  page: Page,
  parentSelector = ".editor-shell"
): Locator | undefined => {
  const selector = `${parentSelector} div[contenteditable="true"]`;
  return page.frame("left")?.locator(selector);
};

export const waitForSelector = async (
  page: Page,
  selector: string,
  options: Parameters<Frame["waitForSelector"]>[1] = {}
): Promise<void> => {
  await page.frame("left")?.waitForSelector(selector, options);
};

export const locate = (page: Page, selector: string): Locator =>
  page.frame("left")!.locator(selector);

export const selectorBoundingBox = async (
  page: Page,
  selector: string
): Promise<
  { height: number; width: number; x: number; y: number } | null | undefined
> => {
  const node = page.frame("left")?.locator(selector);
  return await node?.boundingBox();
};

export const click = async (
  page: Page,
  selector: string,
  options?: Parameters<Frame["click"]>[1]
): Promise<void> => {
  const leftFrame = page.frame("left");
  await leftFrame?.waitForSelector(selector, options);
  await leftFrame?.click(selector, options);
};

export const focus = async (
  page: Page,
  selector: string,
  options?: Parameters<Frame["focus"]>[1]
): Promise<void> => {
  await page.frame("left")?.focus(selector, options);
};

export const selectOption = async (
  page: Page,
  selector: string,
  options: Parameters<Frame["selectOption"]>[1]
): Promise<void> => {
  await page.frame("left")?.selectOption(selector, options);
};

export const textContent = async (
  page: Page,
  selector: string,
  options?: Parameters<Frame["textContent"]>[1]
): Promise<string | null | undefined> =>
  await page.frame("left")?.textContent(selector, options);

export const evaluate = async <T, Arg>(
  page: Page,
  fn: PageFunction<Arg, T>,
  args: Arg = undefined as unknown as Arg
): Promise<T> => (await page.frame("left")?.evaluate<T, Arg>(fn, args)) as T;

export const clearEditor = async (page: Page): Promise<void> => {
  await selectAll(page);
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
};

export const insertHorizontalRule = async (page: Page): Promise<void> => {
  await click(page, '[data-testid="insert-hr"]');
};

export const insertImage = async (page: Page): Promise<void> => {
  // Open gallery
  await click(page, '[data-testid="insert-image"]');
  await click(page, `button[role="tab"]:text("Library")`);

  // Click the only library image item
  await waitForSelector(page, `[role="listitem"][data-grid-item]`);
  await click(page, `[role="listitem"][data-grid-item]`);

  // Confirm the image
  await click(page, `button:text("Confirm")`);
  await waitForSelector(page, `[data-testid="image-node"]`);
};

export const insertEmbed = async (page: Page): Promise<void> => {
  // Open embed modal
  await click(page, '[data-testid="insert-embed"]');
  await page
    .frame("left")!
    .locator(`input[name="url"]`)
    .fill("https://example.com");
  // Confirm the embed
  await click(page, `button:text("Confirm")`);
  await waitForSelector(page, `[data-testid="embed-node"]`);
};

export const mouseMoveToSelector = async (
  page: Page,
  selector: string
): Promise<void> => {
  const {
    x = 0,
    width = 0,
    y = 0,
    height = 0
  } = (await selectorBoundingBox(page, selector)) || {};
  await page.mouse.move(x + width / 2, y + height / 2);
};

export const prettifyHTML = async (
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

// This function does not suppose to do anything, it's only used as a trigger
// for prettier auto-formatting (https://prettier.io/blog/2020/08/24/2.1.0.html#api)
export const html = (
  partials: TemplateStringsArray,
  ...params: any[]
): string => {
  let output = "";

  for (let i = 0; i < partials.length; i++) {
    output += partials[i];

    if (i < partials.length - 1) {
      output += params[i];
    }
  }

  return output;
};
