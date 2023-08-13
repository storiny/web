import { RadioGroupProps as RadioGroupPrimitiveProps } from "@radix-ui/react-radio-group";

import { RadioProps } from "~/components/Radio";
import { PolymorphicProps } from "~/types/index";

type RadioGroupPrimitive = RadioGroupPrimitiveProps & PolymorphicProps<"div">;

export interface RadioGroupProps extends RadioGroupPrimitive {
  /**
   * Automatically resize the component to `lg` when the viewport width is smaller than or
   * equal to tablet
   * @default false
   */
  autoSize?: RadioProps["autoSize"];
  /**
   * Color of individual Radio children.
   */
  color?: RadioProps["color"];
  /**
   * Size of individual Radio children.
   */
  size?: RadioProps["size"];
}
