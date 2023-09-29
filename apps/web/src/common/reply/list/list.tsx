"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedReplyItem,
  VirtualizedReplyScrollSeekPlaceholder
} from "..";
import { VirtualizedReplyListProps } from "./list.props";
import { VirtualizedReplyListContext } from "./list-context";

const VirtualizedReplyList = React.memo(
  ({
    replies,
    has_more,
    load_more,
    replyProps = {},
    skeletonProps = {},
    className,
    ...rest
  }: VirtualizedReplyListProps) => (
    <VirtualizedReplyListContext.Provider value={{ replyProps, skeletonProps }}>
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
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={replies}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedReplyListContext.Provider>
  )
);

VirtualizedReplyList.displayName = "VirtualizedReplyList";

export default VirtualizedReplyList;
