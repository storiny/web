/**
 * Returns caret from a point
 * @param x Point X
 * @param y Point Y
 */
export const caret_from_point = (
  x: number,
  y: number
): null | {
  node: Node;
  offset: number;
} => {
  if (typeof document.caretRangeFromPoint !== "undefined") {
    const range = document.caretRangeFromPoint(x, y);

    if (range === null) {
      return null;
    }

    return {
      node: range.startContainer,
      offset: range.startOffset
    };
  } else if ((document as any).caretPositionFromPoint !== "undefined") {
    const range = (document as any).caretPositionFromPoint(x, y);

    if (range === null) {
      return null;
    }

    return {
      node: range.offsetNode,
      offset: range.offset
    };
  } else {
    // Gracefully handle IE
    return null;
  }
};
