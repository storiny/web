import { Page } from "@playwright/test";

import { sleep } from "../../utils";

/**
 * Presses the provided `key` `numCharacters` times, with a delay of `delayMs` between each keystroke
 * @param page Page
 * @param key Key to press
 * @param numCharacters Number of times to press the key
 * @param delayMs Delay between each keystroke
 */
export const pressKeyTimes = async (
  page: Page,
  key: string,
  numCharacters = 1,
  delayMs?: number
): Promise<void> => {
  for (let i = 0; i < numCharacters; i++) {
    if (delayMs !== undefined) {
      await sleep(delayMs);
    }

    await page.keyboard.press(key);
  }
};
