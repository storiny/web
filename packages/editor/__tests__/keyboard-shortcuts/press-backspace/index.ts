import { Page } from "@playwright/test";

import { press_key_times } from "../press-key-times";

/**
 * Presses backspace `num_characters` times in the current selection with `delay_ms` of delay between each keystroke
 * @param page Page
 * @param num_characters Number of times to press backspace
 * @param delay_ms Delay between each keyboard event
 */
export const press_backspace = async (
  page: Page,
  num_characters?: number,
  delay_ms?: number
): Promise<void> =>
  await press_key_times(page, "Backspace", num_characters, delay_ms);
