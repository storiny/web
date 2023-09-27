import {
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectItemTextProps
} from "@radix-ui/react-select";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type OptionPrimitive = SelectItemProps & PolymorphicProps<"div">;

export interface OptionProps extends OptionPrimitive {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The element placed after the children.
   */
  rightSlot?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
    indicator?: SelectItemIndicatorProps;
    rightSlot?: React.ComponentPropsWithoutRef<"span">;
    text?: SelectItemTextProps;
  };
}
