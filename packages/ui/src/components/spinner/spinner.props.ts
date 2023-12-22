import {
  ProgressIndicatorProps,
  ProgressProps
} from "@radix-ui/react-progress";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type SpinnerSize = "lg" | "md" | "sm" | "xs";
export type SpinnerColor = "inverted" | "ruby";

type SpinnerPrimitive = Omit<ProgressProps, "value"> &
  Omit<PolymorphicProps<"div">, "children">;

export interface SpinnerProps extends SpinnerPrimitive {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: SpinnerColor;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    bar?: React.ComponentPropsWithoutRef<"span">;
    indicator?: ProgressIndicatorProps;
  };
}
