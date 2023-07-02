import {
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectItemTextProps
} from "@radix-ui/react-select";

import { PolymorphicProps } from "~/types/index";

type OptionPrimitive = SelectItemProps & PolymorphicProps<"div">;

export interface OptionProps extends OptionPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    indicator?: SelectItemIndicatorProps;
    text?: SelectItemTextProps;
  };
}
