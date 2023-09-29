import {
  PopoverArrowProps,
  PopoverContentProps,
  PopoverPortalProps,
  PopoverProps as PopoverPrimitiveProps,
  PopoverTriggerProps
} from "@radix-ui/react-popover";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type PopoverPrimitive = PopoverPrimitiveProps & PolymorphicProps<"div">;

export interface PopoverProps extends PopoverPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: PopoverArrowProps;
    content?: PopoverContentProps;
    portal?: PopoverPortalProps;
    trigger?: PopoverTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
