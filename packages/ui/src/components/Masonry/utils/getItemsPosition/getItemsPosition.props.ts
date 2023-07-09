import { Cache } from "../../types";

export type GetItemsPositionProps<T> = {
  /**
   * Layout cache
   */
  cache: Cache<T, number>;
  /**
   * Spacing between items
   */
  gutter?: number;
  /**
   * Approximate width of items
   */
  idealColumnWidth?: number;
  /**
   * Minimum number of columns to render
   */
  minCols?: number;
  /**
   * Container width
   */
  width?: number | null | undefined;
};
