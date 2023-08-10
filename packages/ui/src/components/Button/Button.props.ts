import React from "react";

import { PolymorphicProps } from "~/types/index";

export type ButtonColor = "inverted" | "ruby";
export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonVariant = "rigid" | "hollow" | "ghost";

export interface ButtonProps extends PolymorphicProps<"button"> {
  /**
   * Automatically resize the component to `lg` when the viewport width is smaller than or
   * equal to tablet
   * @default false
   */
  autoSize?: boolean;
  /**
   * The authentication flag to redirect the user to the login page if they are logged out.
   * @default false
   */
  checkAuth?: boolean;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: ButtonColor;
  /**
   * The element placed before the children.
   */
  decorator?: React.ReactNode;
  /**
   * The loading flag.
   * @default false
   */
  loading?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
  /**
   * The component variant.
   * @default 'rigid'
   */
  variant?: ButtonVariant;
}
