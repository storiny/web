"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedFriendRequestItem,
  VirtualizedFriendRequestScrollSeekPlaceholder
} from "..";
import { VirtualizedFriendRequestListProps } from "./List.props";
import { VirtualizedFriendRequestListContext } from "./ListContext";

const VirtualizedFriendRequestList = React.memo(
  ({
    friendRequests,
    hasMore,
    loadMore,
    friendRequestProps,
    className,
    ...rest
  }: VirtualizedFriendRequestListProps) => (
    <VirtualizedFriendRequestListContext.Provider
      value={friendRequestProps || {}}
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
          ...rest?.components,
          Item: VirtualizedFriendRequestItem,
          ScrollSeekPlaceholder: VirtualizedFriendRequestScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualFooter })
        }}
        data={friendRequests}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedFriendRequestListContext.Provider>
  )
);

VirtualizedFriendRequestList.displayName = "VirtualizedFriendRequestList";

export default VirtualizedFriendRequestList;
