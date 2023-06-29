"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import {
  VirtualizedStoryFooter,
  VirtualizedStoryItem,
  VirtualizedStoryScrollSeekPlaceholder,
} from "..";
import { VirtualizedStoryListProps } from "./List.props";
import { VirtualizedStoryListContext } from "./ListContext";

const VirtualizedStoryList = React.memo(
  ({
    stories,
    hasMore,
    loadMore,
    storyProps,
    className,
    ...rest
  }: VirtualizedStoryListProps) => (
    <VirtualizedStoryListContext.Provider value={storyProps || {}}>
      <Virtuoso
        increaseViewportBy={750}
        scrollSeekConfiguration={{
          enter: (velocity): boolean => Math.abs(velocity) > 950,
          exit: (velocity): boolean => Math.abs(velocity) < 10,
        }}
        useWindowScroll
        {...rest}
        className={clsx("full-w", "full-h", className)}
        components={{
          Item: VirtualizedStoryItem,
          ScrollSeekPlaceholder: VirtualizedStoryScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualizedStoryFooter }),
        }}
        data={stories}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedStoryListContext.Provider>
  )
);

VirtualizedStoryList.displayName = "VirtualizedStoryList";

export default VirtualizedStoryList;
