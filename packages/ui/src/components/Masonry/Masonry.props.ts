import React from "react";

import { RenderItemArgs } from "./MeasureItems";

export type MasonryProps<T> = {
  /**
   * The preferred/target item width in pixels. If `layout="flexible"` is set, the item width will
   * grow to fill column space, and shrink to fit if below the minimum number of columns
   * @default 228
   */
  columnWidth?: number;
  /**
   * Function for generating unique keys for items
   * @param data Items
   */
  getItemKey?: (data: T) => string;
  /**
   * The amount of vertical and horizontal space between each item, specified in pixels
   */
  gutterWidth?: number;
  /**
   * Array of items to display that contains the data to be rendered by `renderItem`
   */
  items: T[];
  /**
   * Minimum number of columns to display, regardless of the container width
   * @default 3
   */
  minCols?: number;
  /**
   * Overscan buffer size, specified as a multiplier of the container height. It specifies the amount of extra buffer space for populating visible items
   * @default 1
   */
  overscanFactor?: number;
  /**
   * Function to render item in the grid
   * If present, `heightAdjustment` indicates the number of pixels this item needs to grow/shrink to accommodate a 2-column item in the grid. Items must respond to this prop by adjusting their height or layout issues will occur.
   */
  renderItem: (args: RenderItemArgs<T>) => React.ReactElement;
  /**
   * Function that returns a DOM node that masonry uses for scroll event subscription
   */
  scrollContainer?: () => HTMLElement;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    container?: React.ComponentPropsWithoutRef<"div">;
    item?: React.ComponentPropsWithoutRef<"div">;
  };
};
