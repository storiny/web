import { RadioGroupItemProps } from "@radix-ui/react-radio-group";
import React from "react";

export type RadioColor = "inverted" | "ruby";
export type RadioSize = "md" | "lg";

// Not polymorphic
type RadioGroupPrimitive = Omit<
  RadioGroupItemProps & React.ComponentPropsWithRef<"input" | "button">,
  "color" | "size"
>;

export interface RadioProps extends RadioGroupPrimitive {
  /**
   * Automatically resize the component to `lg` when the viewport width is smaller than or
   * equal to tablet
   * @default false
   */
  auto_size?: boolean;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: RadioColor;
  /**
   * The label placed after the indicator.
   */
  label?: React.ReactNode;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: RadioSize;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    children_container?: React.ComponentPropsWithoutRef<"div">;
    container?: React.ComponentPropsWithoutRef<"div">;
    label?: React.ComponentPropsWithoutRef<"label">;
  };
}
