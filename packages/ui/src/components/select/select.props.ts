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
   * Automatically resize the component to `lg` when the viewport width is
   * smaller than or equal to tablet
   * @default false
   */
  auto_size?: boolean;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: SelectColor;
  /**
   * Trigger element rendering function.
   * @param trigger Trigger element
   */
  render_trigger?: (trigger: React.ReactNode) => React.ReactNode;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: SelectSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    content?: SelectContentProps;
    icon?: SelectIconProps;
    portal?: SelectPortalProps;
    scroll_down_button?: SelectScrollDownButtonProps;
    scroll_up_button?: SelectScrollUpButtonProps;
    trigger?: SelectTriggerProps;
    value?: SelectValueProps;
    viewport?: SelectViewportProps;
  };
  /**
   * The content rendered inside value element.
   */
  value_children?: React.ReactNode;
}
