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
  isMeasuring: boolean;
  /**
   * Item index
   */
  itemIndex: number;
};

export type MeasureItemsProps<T> = React.ComponentPropsWithoutRef<"div"> & {
  /**
   * Relative measurement index
   * @internal
   */
  baseIndex: number;
  /**
   * Function to compute positions of items
   * @param items Items
   */
  getPositions: (items: T[]) => Position[];
  /**
   * Items to render
   */
  items: T[];
  /**
   * Store holding item's measurements
   */
  measurementStore: Cache<T, number>;
  /**
   * Function to render individual items
   */
  renderItem: (args: RenderItemArgs<T>) => React.ReactElement;
};
