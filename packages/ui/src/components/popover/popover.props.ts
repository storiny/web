import { Popover } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type PopoverPrimitive = Popover.PopoverProps & PolymorphicProps<"div">;

export interface PopoverProps extends PopoverPrimitive {
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: Popover.PopoverArrowProps;
    content?: Popover.PopoverContentProps;
    portal?: Popover.PopoverPortalProps;
    trigger?: Popover.PopoverTriggerProps;
  };
  /**
   * The trigger component.
   */
  trigger: React.ReactNode;
}
