import {
  CheckboxIndicatorProps,
  CheckboxProps as CheckboxPrimitiveProps
} from "@radix-ui/react-checkbox";
import React from "react";

export type CheckboxColor = "inverted" | "ruby";
export type CheckboxSize = "md" | "lg";

// Not polymorphic
type CheckboxPrimitive = Omit<
  CheckboxPrimitiveProps & React.ComponentPropsWithRef<"input" | "button">,
  "color" | "size"
>;

export interface CheckboxProps extends CheckboxPrimitive {
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
  color?: CheckboxColor;
  /**
   * The label placed after the indicator.
   */
  label?: React.ReactNode;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: CheckboxSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    container?: React.ComponentPropsWithoutRef<"div">;
    indicator?: CheckboxIndicatorProps;
    label?: React.ComponentPropsWithoutRef<"label">;
  };
}
