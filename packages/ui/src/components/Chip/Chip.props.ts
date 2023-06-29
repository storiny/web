import React from "react";

import { PolymorphicProps } from "~/types/index";

export type ChipType = "static" | "clickable" | "deletable";
export type ChipSize = "md" | "lg";
export type ChipVariant = "rigid" | "soft";

export interface ChipProps
  extends Omit<PolymorphicProps<"button" | "span">, "type"> {
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The disabled state.
   * @default false
   */
  disabled?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ChipSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    action?: React.ComponentPropsWithoutRef<"button">;
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
  /**
   * Whether to render a clickable component.
   * @default 'static'
   */
  type?: ChipType;
  /**
   * The component variant.
   * @default 'rigid'
   */
  variant?: ChipVariant;
}
