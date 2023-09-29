"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedNotificationItem,
  VirtualizedNotificationScrollSeekPlaceholder
} from "..";
import { VirtualizedNotificationListProps } from "./list.props";
import { VirtualizedNotificationListContext } from "./list-context";

const VirtualizedNotificationList = React.memo(
  ({
    notifications,
    has_more,
    load_more,
    notificationProps,
    className,
    ...rest
  }: VirtualizedNotificationListProps) => (
    <VirtualizedNotificationListContext.Provider
      value={notificationProps || {}}
    >
      <Virtuoso
        increaseViewportBy={750}
        scrollSeekConfiguration={{
          enter: (velocity): boolean => Math.abs(velocity) > 950,
          exit: (velocity): boolean => Math.abs(velocity) < 10
        }}
        useWindowScroll
        {...rest}
        className={clsx("full-w", "full-h", className)}
        components={{
          Item: VirtualizedNotificationItem,
          ScrollSeekPlaceholder: VirtualizedNotificationScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={notifications}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedNotificationListContext.Provider>
  )
);

VirtualizedNotificationList.displayName = "VirtualizedNotificationList";

export default VirtualizedNotificationList;
