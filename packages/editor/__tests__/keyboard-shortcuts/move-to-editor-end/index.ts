/**
 * Moves to the end of the editor root
 * @param page Page
 */
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
