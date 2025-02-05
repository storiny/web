import { Slider } from "radix-ui";

import { PolymorphicProps } from "~/types/index";

export type SliderOrientation = "horizontal" | "vertical";

type SliderPrimitive = Slider.SliderProps &
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
  slot_props?: {
    range?: Slider.SliderRangeProps;
    thumb?: Slider.SliderThumbProps;
    track?: Slider.SliderTrackProps;
  };
}
