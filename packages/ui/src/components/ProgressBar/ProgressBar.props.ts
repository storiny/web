import {
  ProgressIndicatorProps,
  ProgressProps
} from "@radix-ui/react-progress";

import { PolymorphicProps } from "~/types/index";

export type ProgressBarSize = "lg" | "md";

type ProgressBarPrimitive = ProgressProps & PolymorphicProps<"div">;

export interface ProgressBarProps extends ProgressBarPrimitive {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ProgressBarSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    indicator?: ProgressIndicatorProps;
  };
  /**
   * The value of the progress indicator.
   */
  value: number;
}
