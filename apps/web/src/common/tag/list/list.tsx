"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import { VirtualizedTagItem, VirtualizedTagScrollSeekPlaceholder } from "..";
import { VirtualizedTagListProps } from "./list.props";
import { VirtualizedTagListContext } from "./list-context";

const VirtualizedTagList = React.memo(
  ({
    tags,
    hasMore,
    loadMore,
    tagProps,
    className,
    ...rest
  }: VirtualizedTagListProps) => (
    <VirtualizedTagListContext.Provider value={tagProps || {}}>
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
          Item: VirtualizedTagItem,
          ScrollSeekPlaceholder: VirtualizedTagScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualFooter })
        }}
        data={tags}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedTagListContext.Provider>
  )
);

VirtualizedTagList.displayName = "VirtualizedTagList";

export default VirtualizedTagList;
