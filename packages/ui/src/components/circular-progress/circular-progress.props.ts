import { Progress } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type CircularProgressSize = "lg" | "md" | "sm" | "xs";
export type CircularProgressColor = "inverted" | "ruby";

type CircularProgressPrimitive = Progress.ProgressProps &
  PolymorphicProps<"div">;

export interface CircularProgressProps extends CircularProgressPrimitive {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: CircularProgressColor;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: CircularProgressSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    indicator?: Progress.ProgressIndicatorProps;
    progress?: React.ComponentPropsWithoutRef<"circle">;
    svg?: React.ComponentPropsWithoutRef<"svg">;
    track?: React.ComponentPropsWithoutRef<"circle">;
  };
}
