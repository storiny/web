import { Toast } from "radix-ui";
import React from "react";

import { PolymorphicProps } from "~/types/index";

type NotificationPrimitive = Toast.ToastProps & PolymorphicProps<"li">;

export interface NotificationProps extends NotificationPrimitive {
  /**
   * The icon placed before the children.
   */
  icon?: React.ReactNode;
  /**
   * The text for primary button.
   * @default 'Confirm'
   */
  primary_button_text?: string;
  /**
   * The text for secondary button.
   * @default 'Dismiss'
   */
  secondary_button_text?: string;
  /**
   * The props passed to the individual component elements.
   */
  slot_props?: {
    actions?: React.ComponentPropsWithoutRef<"div">;
    decorator?: React.ComponentPropsWithoutRef<"span">;
    primary_button?: Omit<Toast.ToastActionProps, "altText"> & {
      altText?: Toast.ToastActionProps["altText"];
    };
    secondary_button?: Toast.ToastCloseProps;
  };
}
