import { Progress } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

export type ProgressBarSize = "lg" | "md";

type ProgressBarPrimitive = Progress.ProgressProps & PolymorphicProps<"div">;

export interface ProgressBarProps extends ProgressBarPrimitive {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ProgressBarSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    indicator?: Progress.ProgressIndicatorProps;
  };
  /**
   * The value of the progress indicator.
   */
  value: number;
}
