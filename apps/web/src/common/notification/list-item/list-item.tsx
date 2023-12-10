"use client";

import { Notification as TNotification } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import Notification from "~/entities/notification";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedNotificationListContext } from "../list/list-context";

const VirtualizedNotificationItem = React.memo(
  ({ item, ...rest }: ItemProps<TNotification>) => {
    // Props from context
    const notification_props = React.useContext(
      VirtualizedNotificationListContext
    );
    return (
      <div {...rest} className={clsx(css["flex-col"], styles["list-item"])}>
        <Notification {...notification_props} notification={item} virtual />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedNotificationItem.displayName = "VirtualizedNotificationItem";

export default VirtualizedNotificationItem;
