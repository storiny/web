import React from "react";

import { Cache, Position } from "../types";

export type RenderItemArgs<T> = {
  /**
   * Item data
   */
  data: T;
  /**
   * Boolean parameter indicating whether the item is currently being measured
   */
  is_measuring: boolean;
  /**
   * Item index
   */
  item_index: number;
};

export type MeasureItemsProps<T> = React.ComponentPropsWithoutRef<"div"> & {
  /**
   * Relative measurement index
   * @internal
   */
  base_index: number;
  /**
   * Function to compute positions of items
   * @param items Items
   */
  get_positions: (items: T[]) => Position[];
  /**
   * Items to render
   */
  items: T[];
  /**
   * Store holding item's measurements
   */
  measurement_store: Cache<T, number>;
  /**
   * Function to render individual items
   */
  render_item: (args: RenderItemArgs<T>) => React.ReactElement;
};
