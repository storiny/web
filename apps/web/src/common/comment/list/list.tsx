"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

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
    has_more,
    load_more,
    comment_props = {},
    skeleton_props = {},
    className,
    ...rest
  }: VirtualizedCommentListProps) => (
    <VirtualizedCommentListContext.Provider
      value={{ comment_props, skeleton_props }}
    >
      <Virtuoso
        increaseViewportBy={750}
        scrollSeekConfiguration={{
          enter: (velocity): boolean => Math.abs(velocity) > 950,
          exit: (velocity): boolean => Math.abs(velocity) < 10
        }}
        useWindowScroll
        {...rest}
        className={clsx(css["full-w"], css["full-h"], className)}
        components={{
          Item: VirtualizedCommentItem,
          ScrollSeekPlaceholder: VirtualizedCommentScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={comments}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedCommentListContext.Provider>
  )
);

VirtualizedCommentList.displayName = "VirtualizedCommentList";

export default VirtualizedCommentList;
