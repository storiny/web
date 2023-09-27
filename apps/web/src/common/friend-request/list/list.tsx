"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedFriendRequestItem,
  VirtualizedFriendRequestScrollSeekPlaceholder
} from "..";
import { VirtualizedFriendRequestListProps } from "./list.props";
import { VirtualizedFriendRequestListContext } from "./list-context";

const VirtualizedFriendRequestList = React.memo(
  ({
    friendRequests,
    has_more,
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
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={friendRequests}
        endReached={has_more ? loadMore : (): void => undefined}
      />
    </VirtualizedFriendRequestListContext.Provider>
  )
);

VirtualizedFriendRequestList.displayName = "VirtualizedFriendRequestList";

export default VirtualizedFriendRequestList;
