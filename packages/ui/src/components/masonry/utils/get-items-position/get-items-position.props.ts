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
  ideal_column_width?: number;
  /**
   * Minimum number of columns to render
   */
  min_cols?: number;
  /**
   * Container width
   */
  width?: number | null | undefined;
};
