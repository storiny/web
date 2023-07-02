"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import {
  VirtualizedUserFooter,
  VirtualizedUserItem,
  VirtualizedUserScrollSeekPlaceholder
} from "..";
import { VirtualizedUserListProps } from "./List.props";
import { VirtualizedUserListContext } from "./ListContext";

const VirtualizedUserList = React.memo(
  ({
    users,
    hasMore,
    loadMore,
    userProps,
    className,
    ...rest
  }: VirtualizedUserListProps) => (
    <VirtualizedUserListContext.Provider value={userProps || {}}>
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
          Item: VirtualizedUserItem,
          ScrollSeekPlaceholder: VirtualizedUserScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualizedUserFooter })
        }}
        data={users}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedUserListContext.Provider>
  )
);

VirtualizedUserList.displayName = "VirtualizedUserList";

export default VirtualizedUserList;
