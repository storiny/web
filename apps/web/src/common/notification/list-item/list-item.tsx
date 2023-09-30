"use client";

import { Notification as TNotification } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "../../../../../../packages/ui/src/components/divider";
import Notification from "~/entities/notification";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedNotificationListContext } from "../list/list-context";

const VirtualizedNotificationItem = React.memo(
  ({ item, ...rest }: ItemProps<TNotification>) => {
    // Props from context
    const notification_props = React.useContext(
      VirtualizedNotificationListContext
    );
    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <Notification {...notification_props} notification={item} virtual />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedNotificationItem.displayName = "VirtualizedNotificationItem";

export default VirtualizedNotificationItem;
