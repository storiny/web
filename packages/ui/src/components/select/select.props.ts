import { Select } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type SelectSize = "lg" | "md" | "sm";
export type SelectColor = "inverted" | "ruby";

type SelectPrimitive = Select.SelectProps & PolymorphicProps<"div">;

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
    content?: Select.SelectContentProps;
    icon?: Select.SelectIconProps;
    portal?: Select.SelectPortalProps;
    scroll_down_button?: Select.SelectScrollDownButtonProps;
    scroll_up_button?: Select.SelectScrollUpButtonProps;
    trigger?: Select.SelectTriggerProps;
    value?: Select.SelectValueProps;
    viewport?: Select.SelectViewportProps;
  };
  /**
   * The content rendered inside value element.
   */
  value_children?: React.ReactNode;
}
