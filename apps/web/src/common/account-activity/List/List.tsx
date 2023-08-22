"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedAccountActivityItem,
  VirtualizedAccountActivityScrollSeekPlaceholder
} from "..";
import { VirtualizedAccountActivityListProps } from "./List.props";
import { VirtualizedAccountActivityListContext } from "./ListContext";

const VirtualizedAccountActivityList = React.memo(
  ({
    accountActivities,
    hasMore,
    loadMore,
    accountActivityProps = {},
    className,
    ...rest
  }: VirtualizedAccountActivityListProps) => (
    <VirtualizedAccountActivityListContext.Provider
      value={{ accountActivityProps, itemCount: accountActivities.length }}
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
          Item: VirtualizedAccountActivityItem,
          ScrollSeekPlaceholder:
            VirtualizedAccountActivityScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualFooter })
        }}
        data={accountActivities}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedAccountActivityListContext.Provider>
  )
);

VirtualizedAccountActivityList.displayName = "VirtualizedAccountActivityList";

export default VirtualizedAccountActivityList;
