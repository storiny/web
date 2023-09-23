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
    hasMore,
    loadMore,
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
          ...(hasMore && { Footer: VirtualFooter })
        }}
        data={notifications}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedNotificationListContext.Provider>
  )
);

VirtualizedNotificationList.displayName = "VirtualizedNotificationList";

export default VirtualizedNotificationList;
