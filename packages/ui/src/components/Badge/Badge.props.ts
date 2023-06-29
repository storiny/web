import React from "react";

import { PolymorphicProps } from "~/types/index";

export type BadgeColor = "beryl" | "inverted" | "melon" | "ruby" | "lemon";
export type BadgeSize = "sm" | "md" | "lg" | "xl";
export type BadgeElevation = "body" | "xs" | "sm" | "md" | "lg";
export interface BadgeOrigin {
  horizontal: "left" | "right";
  vertical: "top" | "bottom";
}

export interface BadgeProps extends PolymorphicProps<"span"> {
  /**
   * The anchor of the component.
   * @default {
   *   vertical: 'bottom',
   *   horizontal: 'right',
   * }
   */
  anchorOrigin?: BadgeOrigin;
  /**
   * The content rendered inside the component.
   */
  badgeContent?: React.ReactNode;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: BadgeColor;
  /**
   * The elevation of the component.
   * @default 'body'
   */
  elevation?: BadgeElevation;
  /**
   * The inset property of the component.
   * @default '14%'
   */
  inset?: string | number;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    container?: React.ComponentPropsWithoutRef<"div">;
  };
  /**
   * The visibility of the component.
   * @default true
   */
  visible?: boolean;
}
