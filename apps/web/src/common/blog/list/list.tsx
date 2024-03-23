"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import { VirtualizedBlogItem, VirtualizedBlogScrollSeekPlaceholder } from "..";
import { VirtualizedBlogListProps } from "./list.props";
import { VirtualizedBlogListContext } from "./list-context";

const VirtualizedBlogList = React.memo(
  ({
    blogs,
    has_more,
    load_more,
    blog_props,
    className,
    ...rest
  }: VirtualizedBlogListProps) => (
    <VirtualizedBlogListContext.Provider value={blog_props || {}}>
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
          Item: VirtualizedBlogItem,
          ScrollSeekPlaceholder: VirtualizedBlogScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={blogs}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedBlogListContext.Provider>
  )
);

VirtualizedBlogList.displayName = "VirtualizedBlogList";

export default VirtualizedBlogList;
