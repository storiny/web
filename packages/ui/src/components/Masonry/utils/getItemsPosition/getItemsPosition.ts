import { Position } from "../../types";
import { smallestElementIndex } from "../smallestElementIndex";
import { GetItemsPositionProps } from "./getItemsPosition.props";

/**
 * Returns the position of items
 * @param gutter Spacing between items
 * @param cache Layout cache
 * @param minCols Minimum number of columns to render
 * @param idealColumnWidth Approximate width of items
 * @param width Container width
 */
export const getItemsPosition = <T>({
  gutter = 0,
  cache,
  minCols = 2,
  idealColumnWidth = 240,
  width
}: GetItemsPositionProps<T>): ((items: T[]) => Position[]) => {
  if (width == null) {
    return (items) =>
      items.map(() => ({
        top: Infinity,
        left: Infinity,
        width: Infinity,
        height: Infinity
      }));
  }

  // The "guessing" here is meant to replicate the pass that the
  // original implementation takes place with CSS
  const colGuess = Math.floor(width / idealColumnWidth);
  const colCount = Math.max(
    Math.floor((width - colGuess * gutter) / idealColumnWidth),
    minCols
  );
  const colWidth = Math.floor(width / colCount);

  return (items: T[]) => {
    // Total height of each column
    const heights = new Array<number>(colCount).fill(0);

    return items.reduce<Position[]>((acc, item) => {
      const positions = acc;
      const height = cache.get(item);
      let position;

      if (height == null) {
        position = {
          top: Infinity,
          left: Infinity,
          width: colWidth,
          height: Infinity
        };
      } else {
        const col = smallestElementIndex(heights);
        const top = heights[col];
        const left = col * colWidth + gutter / 2;
        heights[col] += height;

        position = {
          top,
          left,
          width: colWidth - gutter,
          height
        };
      }

      positions.push(position);
      return positions;
    }, []);
  };
};
