import { Page } from "@playwright/test";

import {
  E2E_BROWSER,
  evaluate,
  IS_LINUX,
  IS_MAC,
  keyDownCtrlOrAlt,
  keyDownCtrlOrMeta,
  keyUpCtrlOrAlt,
  keyUpCtrlOrMeta,
  sleep
} from "../utils";

export const moveToLineBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowLeft");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("Home");
  }
};

export const moveToLineEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowRight");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("End");
  }
};

export const moveToEditorBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowUp");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("PageUp");

    if (E2E_BROWSER === "firefox") {
      await page.keyboard.press("Home");
    }
  }
};

export const moveToEditorEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("ArrowDown");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("PageDown");
    if (E2E_BROWSER === "firefox") {
      await page.keyboard.press("End");
    }
  }
};

export const moveToPrevWord = async (page: Page): Promise<void> => {
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("ArrowLeft");
  await keyUpCtrlOrAlt(page);
};

export const moveToNextWord = async (page: Page): Promise<void> => {
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("ArrowRight");
  await keyUpCtrlOrAlt(page);
};

export const extendToNextWord = async (page: Page): Promise<void> => {
  await page.keyboard.down("Shift");
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("ArrowRight");
  await keyUpCtrlOrAlt(page);
  await page.keyboard.up("Shift");
};

export const deleteNextWord = async (page: Page): Promise<void> => {
  await keyDownCtrlOrAlt(page);
  await page.keyboard.press("Delete");
  await keyUpCtrlOrAlt(page);
};

export const deleteBackward = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Control");
    await page.keyboard.press("h");
    await page.keyboard.up("Control");
  } else {
    await page.keyboard.press("Backspace");
  }
};

export const deleteForward = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Control");
    await page.keyboard.press("d");
    await page.keyboard.up("Control");
  } else {
    await page.keyboard.press("Delete");
  }
};

export const moveToParagraphBeginning = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrAlt(page);
    await page.keyboard.press("ArrowUp");
    await keyUpCtrlOrAlt(page);
  } else {
    await page.keyboard.press("Home");
  }
};

export const moveToParagraphEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await keyDownCtrlOrAlt(page);
    await page.keyboard.press("ArrowDown");
    await keyUpCtrlOrMeta(page);
  } else {
    await page.keyboard.press("End");
  }
};

export const selectAll = async (page: Page): Promise<void> => {
  // TODO Normalize #4665
  if (E2E_BROWSER === "firefox" && IS_LINUX) {
    await evaluate(
      page,
      () => {
        const rootElement = document.querySelector(
          'div[contenteditable="true"]'
        );

        if (rootElement) {
          const selection = window.getSelection();
          selection?.setBaseAndExtent(
            rootElement,
            0,
            rootElement,
            rootElement.childNodes.length
          );
        }
      },
      {}
    );
  } else {
    await keyDownCtrlOrMeta(page);
    await page.keyboard.press("a");
    await keyUpCtrlOrMeta(page);
  }
};

export const undo = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("z");
  await keyUpCtrlOrMeta(page);
};

export const redo = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Meta");
    await page.keyboard.down("Shift");
    await page.keyboard.press("z");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.down("Control");
    await page.keyboard.press("y");
    await page.keyboard.up("Control");
  }
};

export const moveLeft = async (
  page: Page,
  numCharacters = 1,
  delayMs?: number
): Promise<void> => {
  for (let i = 0; i < numCharacters; i++) {
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }

    await page.keyboard.press("ArrowLeft");
  }
};

export const moveRight = async (
  page: Page,
  numCharacters = 1,
  delayMs?: number
): Promise<void> => {
  for (let i = 0; i < numCharacters; i++) {
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }

    await page.keyboard.press("ArrowRight");
  }
};

export const moveUp = async (
  page: Page,
  numCharacters = 1,
  delayMs: number
): Promise<void> => {
  for (let i = 0; i < numCharacters; i++) {
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }

    await page.keyboard.press("ArrowUp");
  }
};

export const moveDown = async (
  page: Page,
  numCharacters = 1,
  delayMs: number
): Promise<void> => {
  for (let i = 0; i < numCharacters; i++) {
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }

    await page.keyboard.press("ArrowDown");
  }
};

export const pressBackspace = async (
  page: Page,
  numCharacters = 1,
  delayMs: number
): Promise<void> => {
  for (let i = 0; i < numCharacters; i++) {
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }

    await page.keyboard.press("Backspace");
  }
};

export const selectCharacters = async (
  page: Page,
  direction: "left" | "right",
  numCharacters = 1
): Promise<void> => {
  const moveFunction = direction === "left" ? moveLeft : moveRight;
  await page.keyboard.down("Shift");
  await moveFunction(page, numCharacters);
  await page.keyboard.up("Shift");
};

export const toggleBold = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("b");
  await keyUpCtrlOrMeta(page);
};

export const toggleUnderline = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("u");
  await keyUpCtrlOrMeta(page);
};

export const toggleItalic = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("i");
  await keyUpCtrlOrMeta(page);
};

export const pressShiftEnter = async (page: Page): Promise<void> => {
  await page.keyboard.down("Shift");
  await page.keyboard.press("Enter");
  await page.keyboard.up("Shift");
};

export const moveToStart = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Meta");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.down("Control");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("Control");
  }
};

export const moveToEnd = async (page: Page): Promise<void> => {
  if (IS_MAC) {
    await page.keyboard.down("Meta");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Meta");
  } else {
    await page.keyboard.down("Control");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Control");
  }
};

export const paste = async (page: Page): Promise<void> => {
  await keyDownCtrlOrMeta(page);
  await page.keyboard.press("KeyV");
  await keyUpCtrlOrMeta(page);
};
