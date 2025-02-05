import { Toast } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type BannerColor = "inverted" | "lemon" | "ruby";
export type BannerIcon = "info" | "warning" | "error";

type BannerPrimitive = Toast.ToastProps & Omit<PolymorphicProps<"li">, "color">;

export interface BannerProps extends BannerPrimitive {
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: BannerColor;
  /**
   * The icon placed before the children.
   */
  icon?: React.ReactNode;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    close?: Toast.ToastCloseProps;
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
