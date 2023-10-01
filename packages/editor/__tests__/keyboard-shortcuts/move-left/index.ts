import { Page } from "@playwright/test";

import { press_key_times } from "../press-key-times";

/**
 * Moves `num_characters` to the left in the current selection with `delay_ms` of delay between each keystroke
 * @param page Page
 * @param num_characters Number of characters to move
 * @param delay_ms Delay between each keyboard event
 */
export const move_left = async (
  page: Page,
  num_characters?: number,
  delay_ms?: number
): Promise<void> =>
  await press_key_times(page, "ArrowLeft", num_characters, delay_ms);
