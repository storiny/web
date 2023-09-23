import { Notification } from "@storiny/types";
import React from "react";

export interface NotificationProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The notification object.
   */
  notification: Notification;
  /**
   * Whether the notification is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
