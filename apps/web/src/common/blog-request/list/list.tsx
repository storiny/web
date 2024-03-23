"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedBlogRequestItem,
  VirtualizedBlogRequestScrollSeekPlaceholder
} from "..";
import { VirtualizedBlogRequestListProps } from "./list.props";
import { VirtualizedBlogRequestListContext } from "./list-context";

const VirtualizedBlogRequestList = React.memo(
  ({
    blog_requests,
    has_more,
    load_more,
    blog_request_props,
    className,
    ...rest
  }: VirtualizedBlogRequestListProps) => (
    <VirtualizedBlogRequestListContext.Provider
      value={blog_request_props || {}}
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
          ...rest?.components,
          Item: VirtualizedBlogRequestItem,
          ScrollSeekPlaceholder: VirtualizedBlogRequestScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={blog_requests}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedBlogRequestListContext.Provider>
  )
);

VirtualizedBlogRequestList.displayName = "VirtualizedBlogRequestList";

export default VirtualizedBlogRequestList;
