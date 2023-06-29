import React from "react";

import { PolymorphicProps } from "~/types/index";

export type StepperSize = "md" | "sm";

export interface StepperProps extends PolymorphicProps<"div"> {
  /**
   * The total number of active steps.
   * @default 1
   */
  activeSteps?: number;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: StepperSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    step?: React.ComponentPropsWithoutRef<"span">;
  };
  /**
   * The total number of steps.
   */
  totalSteps: number;
}
