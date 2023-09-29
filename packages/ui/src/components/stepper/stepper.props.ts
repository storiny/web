import React from "react";

import { PolymorphicProps } from "~/types/index";

export type StepperSize = "md" | "sm";

export interface StepperProps extends PolymorphicProps<"div"> {
  /**
   * The total number of active steps.
   * @default 1
   */
  active_steps?: number;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: StepperSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    step?: React.ComponentPropsWithoutRef<"span">;
  };
  /**
   * The total number of steps.
   */
  total_steps: number;
}
