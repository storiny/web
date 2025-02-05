import { RadioGroup } from "radix-ui";

import { RadioProps } from "~/components/radio";
import { PolymorphicProps } from "~/types/index";

type RadioGroupPrimitive = RadioGroup.RadioGroupProps & PolymorphicProps<"div">;

export interface RadioGroupProps extends RadioGroupPrimitive {
  /**
   * Automatically resize the component to `lg` when the viewport width is
   * smaller than or equal to tablet
   * @default false
   */
  auto_size?: RadioProps["auto_size"];
  /**
   * Color of individual Radio children.
   */
  color?: RadioProps["color"];
  /**
   * Size of individual Radio children.
   */
  size?: RadioProps["size"];
}
