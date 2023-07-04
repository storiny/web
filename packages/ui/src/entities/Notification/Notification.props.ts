import { Notification } from "@storiny/types";
import React from "react";

export interface NotificationProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The notification object.
   */
  notification: Notification;
}
