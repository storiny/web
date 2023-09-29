import {
  ToastCloseProps,
  ToastProps as ToastPrimitiveProps
} from "@radix-ui/react-toast";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type ToastSeverity = "blank" | "warning" | "success" | "error" | "info";

type ToastPrimitive = ToastPrimitiveProps & PolymorphicProps<"li">;

export interface ToastProps extends ToastPrimitive {
  /**
   * The component severity.
   * @default 'blank'
   */
  severity?: ToastSeverity;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    close?: ToastCloseProps;
    decorator?: React.ComponentPropsWithoutRef<"span">;
  };
}
