import { Page, test } from "@playwright/test";

import { IS_WINDOWS } from "../constants";
import {
  move_to_editor_beginning,
  move_to_editor_end,
  move_to_line_beginning,
  move_to_line_end,
  move_to_next_word,
  move_to_paragraph_beginning,
  move_to_paragraph_end,
  move_to_prev_word,
  select_characters,
  toggle_bold
} from "../keyboard-shortcuts";
import { assert_selection, focus_editor, initialize } from "../utils";

/**
 * Inserts test double paragraph nodes
 * @param page Page
 */
const type_paragraphs = async (page: Page): Promise<void> => {
  await page.keyboard.type(
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry."
  );
  await page.keyboard.press("Enter");
  await page.keyboard.type(
    "It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. "
  );
  await page.keyboard.press("Enter");
  await page.keyboard.type(
    "It was popularised in the 1960s with the release of Letraset sheets containing lorem ipsum passages."
  );
};

test.describe("keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await initialize(page);
    await focus_editor(page);
  });

  test("can type several paragraphs", async ({ page }) => {
    await type_paragraphs(page);
    await assert_selection(page, {
      anchor_offset: 100,
      anchor_path: [2, 0, 0],
      focus_offset: 100,
      focus_path: [2, 0, 0]
    });
  });

  test("can move to the beginning of the current line, and then back to the end of the current line", async ({
    page
  }) => {
    await type_paragraphs(page);
    await move_to_line_beginning(page);

    await assert_selection(page, {
      anchor_offset: 68,
      anchor_path: [2, 0, 0],
      focus_offset: 68,
      focus_path: [2, 0, 0]
    });

    await move_to_line_end(page);

    await assert_selection(page, {
      anchor_offset: 100,
      anchor_path: [2, 0, 0],
      focus_offset: 100,
      focus_path: [2, 0, 0]
    });
  });

  test("can move to the top of the editor", async ({ page }) => {
    await type_paragraphs(page);
    await move_to_editor_beginning(page);
    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0],
      focus_offset: 0,
      focus_path: [0, 0, 0]
    });
  });

  test("can move one word to the right", async ({ page, browserName }) => {
    await type_paragraphs(page);
    await move_to_editor_beginning(page);
    await move_to_next_word(page);

    if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 6,
          anchor_path: [0, 0, 0],
          focus_offset: 6,
          focus_path: [0, 0, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 5,
          anchor_path: [0, 0, 0],
          focus_offset: 5,
          focus_path: [0, 0, 0]
        });
      }
    } else if (!IS_WINDOWS) {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 0, 0],
        focus_offset: 5,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 6,
        anchor_path: [0, 0, 0],
        focus_offset: 6,
        focus_path: [0, 0, 0]
      });
    }
  });

  test("can move to the beginning of the previous word", async ({
    page,
    browserName
  }) => {
    await type_paragraphs(page);
    await move_to_prev_word(page);
    // Chrome stops words on punctuation, so we need to press
    // the left arrow key one more time
    if (browserName === "chromium") {
      await move_to_prev_word(page);
    }

    await assert_selection(page, {
      anchor_offset: 91,
      anchor_path: [2, 0, 0],
      focus_offset: 91,
      focus_path: [2, 0, 0]
    });

    await move_to_prev_word(page);

    await assert_selection(page, {
      anchor_offset: 85,
      anchor_path: [2, 0, 0],
      focus_offset: 85,
      focus_path: [2, 0, 0]
    });
  });

  test("can move to the bottom of the editor", async ({ page }) => {
    await type_paragraphs(page);
    await move_to_editor_beginning(page);
    await move_to_editor_end(page);
    await assert_selection(page, {
      anchor_offset: 100,
      anchor_path: [2, 0, 0],
      focus_offset: 100,
      focus_path: [2, 0, 0]
    });
  });

  test("can move to the beginning of the current paragraph", async ({
    page
  }) => {
    await type_paragraphs(page);
    await move_to_paragraph_beginning(page);
    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [2, 0, 0],
      focus_offset: 0,
      focus_path: [2, 0, 0]
    });
  });

  test("can move to the top of the editor, and then to the bottom of the current paragraph", async ({
    page
  }) => {
    await type_paragraphs(page);
    await move_to_editor_beginning(page);
    await move_to_paragraph_end(page);

    await assert_selection(page, {
      // Due to text rendering, it can be in this range of offsets
      anchor_offset: [65, 74],
      anchor_path: [0, 0, 0],
      // Due to text rendering, it can be in this range of offsets
      focus_offset: [65, 74],
      focus_path: [0, 0, 0]
    });
  });

  test("can navigate through the plain text word by word", async ({
    page,
    browserName
  }) => {
    await page.keyboard.type("  123 abc 456  def  ");

    await assert_selection(page, {
      anchor_offset: 20,
      anchor_path: [0, 0, 0],
      focus_offset: 20,
      focus_path: [0, 0, 0]
    });

    // Traverse through the text
    // 1 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 15,
      anchor_path: [0, 0, 0],
      focus_offset: 15,
      focus_path: [0, 0, 0]
    });

    // 2 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 10,
      anchor_path: [0, 0, 0],
      focus_offset: 10,
      focus_path: [0, 0, 0]
    });

    // 3 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 6,
      anchor_path: [0, 0, 0],
      focus_offset: 6,
      focus_path: [0, 0, 0]
    });

    // 4 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });

    // 5 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0],
      focus_offset: 0,
      focus_path: [0, 0, 0]
    });

    // 1 right
    await move_to_next_word(page);

    if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 2,
          anchor_path: [0, 0, 0],
          focus_offset: 2,
          focus_path: [0, 0, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 5,
          anchor_path: [0, 0, 0],
          focus_offset: 5,
          focus_path: [0, 0, 0]
        });
      }
    } else if (!IS_WINDOWS) {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 0, 0],
        focus_offset: 5,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 2,
        anchor_path: [0, 0, 0],
        focus_offset: 2,
        focus_path: [0, 0, 0]
      });
    }

    // 2 right
    await move_to_next_word(page);

    if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 6,
          anchor_path: [0, 0, 0],
          focus_offset: 6,
          focus_path: [0, 0, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 9,
          anchor_path: [0, 0, 0],
          focus_offset: 9,
          focus_path: [0, 0, 0]
        });
      }
    } else if (!IS_WINDOWS) {
      await assert_selection(page, {
        anchor_offset: 9,
        anchor_path: [0, 0, 0],
        focus_offset: 9,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 6,
        anchor_path: [0, 0, 0],
        focus_offset: 6,
        focus_path: [0, 0, 0]
      });
    }

    // 3 right
    await move_to_next_word(page);

    if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 10,
          anchor_path: [0, 0, 0],
          focus_offset: 10,
          focus_path: [0, 0, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 13,
          anchor_path: [0, 0, 0],
          focus_offset: 13,
          focus_path: [0, 0, 0]
        });
      }
    } else if (!IS_WINDOWS) {
      await assert_selection(page, {
        anchor_offset: 13,
        anchor_path: [0, 0, 0],
        focus_offset: 13,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 10,
        anchor_path: [0, 0, 0],
        focus_offset: 10,
        focus_path: [0, 0, 0]
      });
    }

    // 4 right
    await move_to_next_word(page);

    if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 15,
          anchor_path: [0, 0, 0],
          focus_offset: 15,
          focus_path: [0, 0, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 18,
          anchor_path: [0, 0, 0],
          focus_offset: 18,
          focus_path: [0, 0, 0]
        });
      }
    } else if (!IS_WINDOWS) {
      await assert_selection(page, {
        anchor_offset: 18,
        anchor_path: [0, 0, 0],
        focus_offset: 18,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 15,
        anchor_path: [0, 0, 0],
        focus_offset: 15,
        focus_path: [0, 0, 0]
      });
    }

    // 5 right
    await move_to_next_word(page);
    if (!IS_WINDOWS || browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 20,
        anchor_path: [0, 0, 0],
        focus_offset: 20,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 18,
        anchor_path: [0, 0, 0],
        focus_offset: 18,
        focus_path: [0, 0, 0]
      });

      // 6 right
      await move_to_next_word(page);
      await assert_selection(page, {
        anchor_offset: 20,
        anchor_path: [0, 0, 0],
        focus_offset: 20,
        focus_path: [0, 0, 0]
      });
    }
  });

  test("can navigate through formatted text word by word", async ({
    page,
    browserName
  }) => {
    await page.keyboard.type("  123 abc 456  def  ");
    await assert_selection(page, {
      anchor_offset: 20,
      anchor_path: [0, 0, 0],
      focus_offset: 20,
      focus_path: [0, 0, 0]
    });

    // Select `de` and make it bold
    await move_to_prev_word(page);
    await select_characters(page, "right", 2);
    await toggle_bold(page);

    // Select `ab` and make it bold
    await move_to_prev_word(page);
    await move_to_prev_word(page);
    await move_to_prev_word(page);
    await select_characters(page, "right", 2);
    await toggle_bold(page);
    await move_to_line_end(page);

    await assert_selection(page, {
      anchor_offset: 3,
      anchor_path: [0, 4, 0],
      focus_offset: 3,
      focus_path: [0, 4, 0]
    });

    // Traverse through the text

    // 1 left
    await move_to_prev_word(page);
    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 7,
        anchor_path: [0, 2, 0],
        focus_offset: 7,
        focus_path: [0, 2, 0]
      });
    } else if (browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 7,
        anchor_path: [0, 2, 0],
        focus_offset: 7,
        focus_path: [0, 2, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 7,
        anchor_path: [0, 2, 0],
        focus_offset: 7,
        focus_path: [0, 2, 0]
      });
    }

    // 2 left
    await move_to_prev_word(page);
    if (browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 2,
        anchor_path: [0, 2, 0],
        focus_offset: 2,
        focus_path: [0, 2, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 2,
        anchor_path: [0, 2, 0],
        focus_offset: 2,
        focus_path: [0, 2, 0]
      });
    }

    // 3 left
    await move_to_prev_word(page);
    if (browserName === "firefox") {
      await assert_selection(page, {
        anchor_offset: 6,
        anchor_path: [0, 0, 0],
        focus_offset: 6,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 6,
        anchor_path: [0, 0, 0],
        focus_offset: 6,
        focus_path: [0, 0, 0]
      });
    }

    // 4 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 2,
      anchor_path: [0, 0, 0],
      focus_offset: 2,
      focus_path: [0, 0, 0]
    });

    // 5 left
    await move_to_prev_word(page);
    await assert_selection(page, {
      anchor_offset: 0,
      anchor_path: [0, 0, 0],
      focus_offset: 0,
      focus_path: [0, 0, 0]
    });

    // 1 right
    await move_to_next_word(page);

    if (IS_WINDOWS && browserName === "chromium") {
      await assert_selection(page, {
        anchor_offset: 2,
        anchor_path: [0, 0, 0],
        focus_offset: 2,
        focus_path: [0, 0, 0]
      });
    } else if (browserName === "firefox" && IS_WINDOWS) {
      await assert_selection(page, {
        anchor_offset: 2,
        anchor_path: [0, 0, 0],
        focus_offset: 2,
        focus_path: [0, 0, 0]
      });
    } else {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 0, 0],
        focus_offset: 5,
        focus_path: [0, 0, 0]
      });
    }

    // 2 right
    await move_to_next_word(page);

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 1,
        anchor_path: [0, 2, 0],
        focus_offset: 1,
        focus_path: [0, 2, 0]
      });
    } else if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 0,
          anchor_path: [0, 1, 0],
          focus_offset: 0,
          focus_path: [0, 1, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 1,
          anchor_path: [0, 2, 0],
          focus_offset: 1,
          focus_path: [0, 2, 0]
        });
      }
    } else {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 6,
          anchor_path: [0, 0, 0],
          focus_offset: 6,
          focus_path: [0, 0, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 1,
          anchor_path: [0, 2, 0],
          focus_offset: 1,
          focus_path: [0, 2, 0]
        });
      }
    }

    // 3 right
    await move_to_next_word(page);

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 5,
        anchor_path: [0, 2, 0],
        focus_offset: 5,
        focus_path: [0, 2, 0]
      });
    } else if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 2,
          anchor_path: [0, 2, 0],
          focus_offset: 2,
          focus_path: [0, 2, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 5,
          anchor_path: [0, 2, 0],
          focus_offset: 5,
          focus_path: [0, 2, 0]
        });
      }
    } else {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 2,
          anchor_path: [0, 2, 0],
          focus_offset: 2,
          focus_path: [0, 2, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 5,
          anchor_path: [0, 2, 0],
          focus_offset: 5,
          focus_path: [0, 2, 0]
        });
      }
    }

    // 4 right
    await move_to_next_word(page);

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 1,
        anchor_path: [0, 4, 0],
        focus_offset: 1,
        focus_path: [0, 4, 0]
      });
    } else if (browserName === "firefox") {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 0,
          anchor_path: [0, 3, 0],
          focus_offset: 0,
          focus_path: [0, 3, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 1,
          anchor_path: [0, 4, 0],
          focus_offset: 1,
          focus_path: [0, 4, 0]
        });
      }
    } else {
      if (IS_WINDOWS) {
        await assert_selection(page, {
          anchor_offset: 7,
          anchor_path: [0, 2, 0],
          focus_offset: 7,
          focus_path: [0, 2, 0]
        });
      } else {
        await assert_selection(page, {
          anchor_offset: 1,
          anchor_path: [0, 4, 0],
          focus_offset: 1,
          focus_path: [0, 4, 0]
        });
      }
    }

    // 5 right
    await move_to_next_word(page);

    if (browserName === "webkit") {
      await assert_selection(page, {
        anchor_offset: 3,
        anchor_path: [0, 4, 0],
        focus_offset: 3,
        focus_path: [0, 4, 0]
      });
    } else if (!IS_WINDOWS || browserName === "firefox") {
      if (browserName === "firefox") {
        if (IS_WINDOWS) {
          await assert_selection(page, {
            anchor_offset: 3,
            anchor_path: [0, 4, 0],
            focus_offset: 3,
            focus_path: [0, 4, 0]
          });
        } else {
          await assert_selection(page, {
            anchor_offset: 3,
            anchor_path: [0, 4, 0],
            focus_offset: 3,
            focus_path: [0, 4, 0]
          });
        }
      } else {
        await assert_selection(page, {
          anchor_offset: 3,
          anchor_path: [0, 4, 0],
          focus_offset: 3,
          focus_path: [0, 4, 0]
        });
      }
    } else {
      // 6 right
      await move_to_next_word(page);
      await assert_selection(page, {
        anchor_offset: 3,
        anchor_path: [0, 4, 0],
        focus_offset: 3,
        focus_path: [0, 4, 0]
      });
    }
  });
});
