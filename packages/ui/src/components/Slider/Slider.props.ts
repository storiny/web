import {
  SliderProps as SliderPrimitiveProps,
  SliderRangeProps,
  SliderThumbProps,
  SliderTrackProps
} from "@radix-ui/react-slider";

import { PolymorphicProps } from "~/types/index";

export type SliderOrientation = "horizontal" | "vertical";

type SliderPrimitive = SliderPrimitiveProps &
  Omit<PolymorphicProps<"span">, "defaultValue">;

export interface SliderProps extends SliderPrimitive {
  /**
   * The orientation of the component.
   * @default 'horizontal'
   */
  orientation?: SliderOrientation;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    range?: SliderRangeProps;
    thumb?: SliderThumbProps;
    track?: SliderTrackProps;
  };
}
