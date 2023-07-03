import {
  SelectContentProps,
  SelectIconProps,
  SelectPortalProps,
  SelectProps as SelectPrimitiveProps,
  SelectScrollDownButtonProps,
  SelectScrollUpButtonProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectViewportProps
} from "@radix-ui/react-select";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type SelectSize = "lg" | "md" | "sm";
export type SelectColor = "inverted" | "ruby";

type SelectPrimitive = SelectPrimitiveProps & PolymorphicProps<"div">;

export interface SelectProps extends SelectPrimitive {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: SelectColor;
  /**
   * Trigger element rendering function.
   * @param trigger Trigger element
   */
  renderTrigger?: (trigger: React.ReactNode) => React.ReactNode;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: SelectSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    content?: SelectContentProps;
    icon?: SelectIconProps;
    portal?: SelectPortalProps;
    scrollDownButton?: SelectScrollDownButtonProps;
    scrollUpButton?: SelectScrollUpButtonProps;
    trigger?: SelectTriggerProps;
    value?: SelectValueProps;
    viewport?: SelectViewportProps;
  };
  /**
   * The content rendered inside value element.
   */
  valueChildren?: React.ReactNode;
}
