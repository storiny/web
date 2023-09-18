import { expect, Page } from "@playwright/test";

type EditorSelection = {
  anchorOffset: number | number[];
  anchorPath: number[];
  focusOffset: number | number[];
  focusPath: number[];
};

/**
 * Asserts selection on the editor
 * @param page Page
 * @param expected Expected selection
 */
export const assertSelection = async (
  page: Page,
  expected: EditorSelection
): Promise<void> => {
  const frame = page.frame("left");

  if (!frame) {
    return;
  }

  const selection = await frame.evaluate(() => {
    const rootElement = document.querySelector('div[contenteditable="true"]');

    const getPathFromNode = (node: Node | null): number[] => {
      if (node === rootElement) {
        return [];
      }

      const path: number[] = [];

      while (node !== null) {
        const parent = node.parentNode;

        if (parent === null || node === rootElement) {
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

    const { anchorNode, anchorOffset, focusNode, focusOffset } =
      window.getSelection()!;

    return {
      anchorOffset,
      anchorPath: getPathFromNode(anchorNode),
      focusOffset,
      focusPath: getPathFromNode(focusNode)
    };
  }, expected);

  expect(selection.anchorPath).toEqual(expected.anchorPath);
  expect(selection.focusPath).toEqual(expected.focusPath);

  if (Array.isArray(expected.anchorOffset)) {
    const [start, end] = expected.anchorOffset;

    expect(selection.anchorOffset).toBeGreaterThanOrEqual(start);
    expect(selection.anchorOffset).toBeLessThanOrEqual(end);
  } else {
    expect(selection.anchorOffset).toEqual(expected.anchorOffset);
  }

  if (Array.isArray(expected.focusOffset)) {
    const [start, end] = expected.focusOffset;

    expect(selection.focusOffset).toBeGreaterThanOrEqual(start);
    expect(selection.focusOffset).toBeLessThanOrEqual(end);
  } else {
    expect(selection.focusOffset).toEqual(expected.focusOffset);
  }
};
