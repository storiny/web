import {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipPortalProps,
  TooltipProps as TooltipPrimitiveProps,
  TooltipTriggerProps,
} from "@radix-ui/react-tooltip";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type TooltipPrimitive = TooltipPrimitiveProps &
  Omit<PolymorphicProps<"div">, "content">;

export interface TooltipProps extends TooltipPrimitive {
  /**
   * The tooltip content.
   */
  content?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    arrow?: TooltipArrowProps;
    content?: TooltipContentProps;
    portal?: TooltipPortalProps;
    trigger?: TooltipTriggerProps;
  };
}
