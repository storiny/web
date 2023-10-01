import { Page } from "@playwright/test";

import { sleep } from "../../utils";

/**
 * Presses the provided `key` `num_characters` times, with a delay of `delay_ms` between each keystroke
 * @param page Page
 * @param key Key to press
 * @param num_characters Number of times to press the key
 * @param delay_ms Delay between each keystroke
 */
export const press_key_times = async (
  page: Page,
  key: string,
  num_characters = 1,
  delay_ms?: number
): Promise<void> => {
  for (let i = 0; i < num_characters; i++) {
    if (delay_ms !== undefined) {
      await sleep(delay_ms);
    }

    await page.keyboard.press(key);
  }
};
