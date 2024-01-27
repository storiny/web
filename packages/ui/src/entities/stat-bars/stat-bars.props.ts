import React from "react";

/**
 * The data for stat bars, an array of tuples of labels with their
 * corresponding values.
 */
export type StatBarsData = [label: string, value: number][];

export interface StatBarsProps<T extends StatBarsData>
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The data for the stat bars
   */
  data: T;
  /**
   * The optional icon map for the bars
   */
  icon_map?: Partial<Record<T[number][0], React.ReactElement>>;
  /**
   * The maximum value of the statistics
   */
  max_value: number;
}
