import { Page } from "@playwright/test";

import { move_left } from "../move-left";
import { move_right } from "../move-right";

/**
 * Selects `num_characters` in the specified direction
 * @param page Page
 * @param direction Selection direction
 * @param num_characters Number of characters to select
 */
export const select_characters = async (
  page: Page,
  direction: "left" | "right",
  num_characters = 1
): Promise<void> => {
  const move_function = direction === "left" ? move_left : move_right;
  await page.keyboard.down("Shift");
  await move_function(page, num_characters);
  await page.keyboard.up("Shift");
};
