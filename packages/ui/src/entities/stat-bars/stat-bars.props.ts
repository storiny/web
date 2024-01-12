import React from "react";

/**
 * The data for stat bars, key-value pairs of labels and their
 * corresponding values.
 */
export type StatBarsData = Record<string, number>;

export interface StatBarsProps<T extends StatBarsData>
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The data for the stat bars
   */
  data: T;
  /**
   * The optional icon map for the bars
   */
  icon_map?: Partial<Record<keyof T, React.ReactElement>>;
  /**
   * The maximum value of the statistics
   */
  max_value: number;
}
