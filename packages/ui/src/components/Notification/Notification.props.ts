import {
  ToastActionProps,
  ToastCloseProps,
  ToastProps as ToastPrimitiveProps,
} from "@radix-ui/react-toast";
import React from "react";

import { PolymorphicProps } from "~/types/index";

export type NotificationIcon = "info" | "typography" | "exclamation";

type NotificationPrimitive = ToastPrimitiveProps & PolymorphicProps<"li">;

export interface NotificationProps extends NotificationPrimitive {
  /**
   * The icon placed before the children.
   */
  icon?: NotificationIcon;
  /**
   * The text for primary button.
   * @default 'Confirm'
   */
  primaryButtonText?: string;
  /**
   * The text for secondary button.
   * @default 'Dismiss'
   */
  secondaryButtonText?: string;
  /**
   * The props passed to the individual component elements.
   */
  slotProps?: {
    actions?: React.ComponentPropsWithoutRef<"div">;
    decorator?: React.ComponentPropsWithoutRef<"span">;
    primaryButton?: Omit<ToastActionProps, "altText"> & {
      altText?: ToastActionProps["altText"];
    };
    secondaryButton?: ToastCloseProps;
  };
}
