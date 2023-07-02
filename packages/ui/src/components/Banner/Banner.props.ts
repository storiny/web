import {
  ToastCloseProps,
  ToastProps as ToastPrimitiveProps
} from "@radix-ui/react-toast";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type BannerColor = "inverted" | "lemon" | "ruby";
export type BannerIcon = "info" | "warning" | "error";

type BannerPrimitive = ToastPrimitiveProps &
  Omit<PolymorphicProps<"li">, "color">;

export interface BannerProps extends BannerPrimitive {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: BannerColor;
  /**
   * The icon placed before the children.
   */
  icon?: BannerIcon;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    close?: ToastCloseProps;
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
