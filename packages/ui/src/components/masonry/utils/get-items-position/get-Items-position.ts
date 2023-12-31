import { Position } from "../../types";
import { smallest_element_index } from "../smallest-element-index";
import { GetItemsPositionProps } from "./get-items-position.props";

/**
 * Returns the position of items
 * @param gutter Spacing between items
 * @param cache Layout cache
 * @param min_cols Minimum number of columns to render
 * @param ideal_column_width Approximate width of items
 * @param width Container width
 */
export const get_items_position = <T>({
  gutter = 0,
  cache,
  min_cols = 2,
  ideal_column_width = 240,
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

  // The "guessing" here is meant to replicate the pass that the original
  // implementation takes place with CSS
  const col_guess = Math.floor(width / ideal_column_width);
  const col_count = Math.max(
    Math.floor((width - col_guess * gutter) / ideal_column_width),
    min_cols
  );
  const col_width = Math.floor(width / col_count);

  return (items: T[]) => {
    // Total height of each column
    const heights = new Array<number>(col_count).fill(0);

    return items.reduce<Position[]>((acc, item) => {
      const positions = acc;
      const height = cache.get(item);
      let position;

      if (height == null) {
        position = {
          top: Infinity,
          left: Infinity,
          width: col_width,
          height: Infinity
        };
      } else {
        const col = smallest_element_index(heights);
        const top = heights[col];
        const left = col * col_width + gutter / 2;
        heights[col] += height;

        position = {
          top,
          left,
          width: col_width - gutter,
          height
        };
      }

      positions.push(position);
      return positions;
    }, []);
  };
};
