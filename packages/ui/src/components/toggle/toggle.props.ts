import { ToggleProps as TogglePrimitiveProps } from "@radix-ui/react-toggle";
import React from "react";

import { PolymorphicProps } from "~/types/index";

import { TooltipProps } from "../tooltip";

export type ToggleSize = "xs" | "sm" | "md" | "lg";

type TogglePrimitive = TogglePrimitiveProps & PolymorphicProps<"button">;

export interface ToggleProps extends TogglePrimitive {
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ToggleSize;
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
