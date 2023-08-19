"use client";

import { Notification as TNotification } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/Divider";
import Notification from "~/entities/Notification";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedNotificationListContext } from "../List/ListContext";

const VirtualizedNotificationItem = React.memo(
  ({ item, ...rest }: ItemProps<TNotification>) => {
    // Props from context
    const notificationProps = React.useContext(
      VirtualizedNotificationListContext
    );

    return (
      <div
        {...rest}
        className={clsx("flex-col", styles.x, styles["list-item"])}
        key={item.id}
      >
        <Notification {...notificationProps} notification={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedNotificationItem.displayName = "VirtualizedNotificationItem";

export default VirtualizedNotificationItem;
