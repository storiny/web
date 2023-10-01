import { expect, Page } from "@playwright/test";

type EditorSelection = {
  anchor_offset: number | number[];
  anchor_path: number[];
  focus_offset: number | number[];
  focus_path: number[];
};

/**
 * Asserts selection on the editor
 * @param page Page
 * @param expected Expected selection
 */
export const assert_selection = async (
  page: Page,
  expected: EditorSelection
): Promise<void> => {
  const frame = page.frame("left");

  if (!frame) {
    return;
  }

  const selection = await frame.evaluate(() => {
    const root_element = document.querySelector('div[contenteditable="true"]');

    const get_path_from_node = (node: Node | null): number[] => {
      if (node === root_element) {
        return [];
      }

      const path: number[] = [];

      while (node !== null) {
        const parent = node.parentNode;

        if (parent === null || node === root_element) {
          break;
        }

        path.push(
          Array.from(parent.childNodes).indexOf(
            node as (typeof parent.childNodes)[number]
          )
        );
        node = parent;
      }

      return path.reverse();
    };

    const {
      anchorNode: anchor_node,
      anchor_offset: anchor_offset,
      focusNode: focus_node,
      focusOffset: focus_offset
    } = window.getSelection()!;

    return {
      anchor_offset,
      anchor_path: get_path_from_node(anchor_node),
      focus_offset,
      focus_path: get_path_from_node(focus_node)
    };
  }, expected);

  expect(selection.anchor_path).toEqual(expected.anchor_path);
  expect(selection.focus_path).toEqual(expected.focus_path);

  if (Array.isArray(expected.anchor_offset)) {
    const [start, end] = expected.anchor_offset;

    expect(selection.anchor_offset).toBeGreaterThanOrEqual(start);
    expect(selection.anchor_offset).toBeLessThanOrEqual(end);
  } else {
    expect(selection.anchor_offset).toEqual(expected.anchor_offset);
  }

  if (Array.isArray(expected.focus_offset)) {
    const [start, end] = expected.focus_offset;

    expect(selection.focus_offset).toBeGreaterThanOrEqual(start);
    expect(selection.focus_offset).toBeLessThanOrEqual(end);
  } else {
    expect(selection.focus_offset).toEqual(expected.focus_offset);
  }
};
