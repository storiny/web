import {
  ProgressIndicatorProps,
  ProgressProps
} from "@radix-ui/react-progress";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type CircularProgressSize = "lg" | "md" | "sm" | "xs";
export type CircularProgressColor = "inverted" | "ruby";

type CircularProgressPrimitive = ProgressProps & PolymorphicProps<"div">;

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
    indicator?: ProgressIndicatorProps;
    progress?: React.ComponentPropsWithoutRef<"circle">;
    svg?: React.ComponentPropsWithoutRef<"svg">;
    track?: React.ComponentPropsWithoutRef<"circle">;
  };
}
