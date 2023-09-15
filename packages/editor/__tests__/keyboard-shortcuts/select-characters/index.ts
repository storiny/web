import { Page } from "@playwright/test";

import { moveLeft } from "../move-left";
import { moveRight } from "../move-right";

/**
 * Selects `numCharacters` in the specified direction
 * @param page Page
 * @param direction Selection direction
 * @param numCharacters Number of characters to select
 */
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
