"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedReplyItem,
  VirtualizedReplyScrollSeekPlaceholder
} from "..";
import { VirtualizedReplyListProps } from "./List.props";
import { VirtualizedReplyListContext } from "./ListContext";

const VirtualizedReplyList = React.memo(
  ({
    replies,
    hasMore,
    loadMore,
    replyProps = {},
    className,
    ...rest
  }: VirtualizedReplyListProps) => (
    <VirtualizedReplyListContext.Provider value={{ replyProps }}>
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
          Item: VirtualizedReplyItem,
          ScrollSeekPlaceholder: VirtualizedReplyScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualFooter })
        }}
        data={replies}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedReplyListContext.Provider>
  )
);

VirtualizedReplyList.displayName = "VirtualizedReplyList";

export default VirtualizedReplyList;
