import { Page } from "@playwright/test";

import { pressKeyTimes } from "../press-key-times";

/**
 * Moves `numCharacters` to the right in the current selection with `delayMs` of delay between each keystroke
 * @param page Page
 * @param numCharacters Number of characters to move
 * @param delayMs Delay between each keyboard event
 */
export const moveRight = async (
  page: Page,
  numCharacters?: number,
  delayMs?: number
): Promise<void> =>
  await pressKeyTimes(page, "ArrowRight", numCharacters, delayMs);
