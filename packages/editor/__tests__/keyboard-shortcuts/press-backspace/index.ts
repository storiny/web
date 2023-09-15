import { Page } from "@playwright/test";

import { pressKeyTimes } from "../press-key-times";

/**
 * Presses backspace `numCharacters` times in the current selection with `delayMs` of delay between each keystroke
 * @param page Page
 * @param numCharacters Number of times to press backspace
 * @param delayMs Delay between each keyboard event
 */
export const pressBackspace = async (
  page: Page,
  numCharacters?: number,
  delayMs?: number
): Promise<void> =>
  await pressKeyTimes(page, "Backspace", numCharacters, delayMs);
