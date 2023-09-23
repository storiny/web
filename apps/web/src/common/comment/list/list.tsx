"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedCommentItem,
  VirtualizedCommentScrollSeekPlaceholder
} from "..";
import { VirtualizedCommentListProps } from "./list.props";
import { VirtualizedCommentListContext } from "./list-context";

const VirtualizedCommentList = React.memo(
  ({
    comments,
    hasMore,
    loadMore,
    commentProps = {},
    skeletonProps = {},
    className,
    ...rest
  }: VirtualizedCommentListProps) => (
    <VirtualizedCommentListContext.Provider
      value={{ commentProps, skeletonProps }}
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
          Item: VirtualizedCommentItem,
          ScrollSeekPlaceholder: VirtualizedCommentScrollSeekPlaceholder,
          ...(hasMore && { Footer: VirtualFooter })
        }}
        data={comments}
        endReached={hasMore ? loadMore : (): void => undefined}
      />
    </VirtualizedCommentListContext.Provider>
  )
);

VirtualizedCommentList.displayName = "VirtualizedCommentList";

export default VirtualizedCommentList;
