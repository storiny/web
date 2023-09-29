import { ToggleGroupItemProps as ToggleGroupItemPrimitiveProps } from "@radix-ui/react-toggle-group";
import React from "react";

import { PolymorphicProps } from "~/types/index";

import { TooltipProps } from "../tooltip";

export type ToggleGroupItemSize = "xs" | "sm" | "md" | "lg";

type ToggleGroupItemPrimitive = ToggleGroupItemPrimitiveProps &
  PolymorphicProps<"button">;

export interface ToggleGroupItemProps extends ToggleGroupItemPrimitive {
  /**
   * The size of the component. Overrides the size
   * inferred from the context.
   */
  size?: ToggleGroupItemSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    container?: React.ComponentPropsWithoutRef<"span">;
    tooltip?: TooltipProps;
  };
  /**
   * Whether to render a tooltip with content.
   */
  tooltip_content?: TooltipProps["content"];
}
