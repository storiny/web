import { Tooltip } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type TooltipPrimitive = Tooltip.TooltipProps &
  Omit<PolymorphicProps<"div">, "content">;

export interface TooltipProps extends TooltipPrimitive {
  /**
   * The tooltip content.
   */
  content?: React.ReactNode;
  /**
   * The element placed after the content.
   */
  right_slot?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    arrow?: Tooltip.TooltipArrowProps;
    content?: Tooltip.TooltipContentProps;
    portal?: Tooltip.TooltipPortalProps;
    right_slot?: React.ComponentPropsWithoutRef<"span">;
    trigger?: Tooltip.TooltipTriggerProps;
  };
}
