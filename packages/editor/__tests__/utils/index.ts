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
export const IS_COLLAB =
  process.env.E2E_EDITOR_MODE === "rich-text-with-collab";
export const LEGACY_EVENTS = process.env.E2E_EVENTS_MODE === "legacy-events";
export const SAMPLE_IMAGE_URL =
  E2E_PORT === 3000
    ? "/src/images/yellow-flower.jpg"
    : "/assets/yellow-flower.a2a7c7a2.jpg";
export const SAMPLE_LANDSCAPE_IMAGE_URL =
  E2E_PORT === 3000
    ? "/src/images/landscape.jpg"
    : "/assets/landscape.21352c66.jpg";
export const LEXICAL_IMAGE_BASE64 =
  "data:image/png;base64,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";
export const YOUTUBE_SAMPLE_URL =
  "https://www.youtube-nocookie.com/embed/jNQXAC9IVRw";

export const initialize = async (page: Page): Promise<void> => {
  const url = `http://localhost:${E2E_PORT}/split/?collab_id=${nanoid()}`;

  await page.setViewportSize({ height: 1000, width: 3000 });
  await page.goto(url);
  await exposeLexicalEditor(page);
};

const exposeLexicalEditor = async (page: Page): Promise<void> => {
  await page.frame("left")!.evaluate(() => {
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
  args: Arg
): Promise<T> => (await page.frame("left")?.evaluate<T, Arg>(fn, args)) as T;

export const clearEditor = async (page: Page): Promise<void> => {
  await selectAll(page);
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

// export const insertUrlImage = async (page, url, altText) => {
//   await selectFromInsertDropdown(page, ".image");
//   await click(page, 'button[data-test-id="image-modal-option-url"]');
//   await focus(page, 'input[data-test-id="image-modal-url-input"]');
//   await page.keyboard.type(url);
//   if (altText) {
//     await focus(page, 'input[data-test-id="image-modal-alt-text-input"]');
//     await page.keyboard.type(altText);
//   }
//   await click(page, 'button[data-test-id="image-modal-confirm-btn"]');
// };

// export const insertUploadImage = async (page, files, altText) => {
//   await selectFromInsertDropdown(page, ".image");
//   await click(page, 'button[data-test-id="image-modal-option-file"]');
//
//   const frame = IS_COLLAB ? await page.frame("left") : page;
//   await frame.setInputFiles(
//     'input[data-test-id="image-modal-file-upload"]',
//     files
//   );
//
//   if (altText) {
//     await focus(page, 'input[data-test-id="image-modal-alt-text-input"]');
//     await page.keyboard.type(altText);
//   }
//   await click(page, 'button[data-test-id="image-modal-file-upload-btn"]');
// };

// export const insertYouTubeEmbed = async (page, url) => {
//   await selectFromInsertDropdown(page, ".youtube");
//   await focus(page, 'input[data-test-id="youtube-video-embed-modal-url"]');
//   await page.keyboard.type(url);
//   await click(
//     page,
//     'button[data-test-id="youtube-video-embed-modal-submit-btn"]'
//   );
// };

// export const insertHorizontalRule = async (page) => {
//   await selectFromInsertDropdown(page, ".horizontal-rule");
// };

// export const insertImageCaption = async (page, caption) => {
//   await click(page, ".editor-image img");
//   await click(page, ".image-caption-button");
//   await waitForSelector(page, ".editor-image img.focused", {
//     state: "detached"
//   });
//   await focusEditor(page, ".image-caption-container");
//   await page.keyboard.type(caption);
// };

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

// export const dragMouse = async (
//   page,
//   fromBoundingBox,
//   toBoundingBox,
//   positionStart = "middle",
//   positionEnd = "middle",
//   mouseUp = true
// ) => {
//   let fromX = fromBoundingBox.x;
//   let fromY = fromBoundingBox.y;
//   if (positionStart === "middle") {
//     fromX += fromBoundingBox.width / 2;
//     fromY += fromBoundingBox.height / 2;
//   } else if (positionStart === "end") {
//     fromX += fromBoundingBox.width;
//     fromY += fromBoundingBox.height;
//   }
//   await page.mouse.move(fromX, fromY);
//   await page.mouse.down();
//
//   let toX = toBoundingBox.x;
//   let toY = toBoundingBox.y;
//   if (positionEnd === "middle") {
//     toX += toBoundingBox.width / 2;
//     toY += toBoundingBox.height / 2;
//   } else if (positionEnd === "end") {
//     toX += toBoundingBox.width;
//     toY += toBoundingBox.height;
//   }
//
//   await page.mouse.move(toX, toY);
//
//   if (mouseUp) {
//     await page.mouse.up();
//   }
// };

// export const dragImage = async (
//   page,
//   toSelector,
//   positionStart = "middle",
//   positionEnd = "middle"
// ) => {
//   await dragMouse(
//     page,
//     await selectorBoundingBox(page, ".editor-image img"),
//     await selectorBoundingBox(page, toSelector),
//     positionStart,
//     positionEnd
//   );
// };

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

// export const selectFromAdditionalStylesDropdown = async (page, selector) => {
//   await click(
//     page,
//     '.toolbar-item[aria-label="Formatting options for additional text styles"]'
//   );
//   await click(page, ".dropdown " + selector);
// };
//
// export const selectFromFormatDropdown = async (page, selector) => {
//   await click(
//     page,
//     '.toolbar-item[aria-label="Formatting options for text style"]'
//   );
//   await click(page, ".dropdown " + selector);
// };
//
// export const selectFromInsertDropdown = async (page, selector) => {
//   await click(
//     page,
//     '.toolbar-item[aria-label="Insert specialized editor node"]'
//   );
//   await click(page, ".dropdown " + selector);
// };
//
// export const selectFromAlignDropdown = async (page, selector) => {
//   await click(
//     page,
//     '.toolbar-item[aria-label="Formatting options for text alignment"]'
//   );
//   await click(page, ".dropdown " + selector);
// };

export const enableCompositionKeyEvents = async (page: Page): Promise<void> => {
  await page.frame("left")?.evaluate(() => {
    window.addEventListener(
      "compositionstart",
      () => {
        document.activeElement?.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Unidentified",
            keyCode: 220
          })
        );
      },
      true
    );
  });
};

export const pressToggleBold = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("b");
  await keyUpCtrlOrMeta(page);
};

export const pressToggleItalic = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("b");
  await keyUpCtrlOrMeta(page);
};

export const pressToggleUnderline = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("u");
  await keyUpCtrlOrMeta(page);
};

// export const dragDraggableMenuTo = async (
//   page,
//   toSelector,
//   positionStart = "middle",
//   positionEnd = "middle"
// ) => {
//   await dragMouse(
//     page,
//     await selectorBoundingBox(page, ".draggable-block-menu"),
//     await selectorBoundingBox(page, toSelector),
//     positionStart,
//     positionEnd
//   );
// };
