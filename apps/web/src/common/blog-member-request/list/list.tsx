"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedBlogMemberRequestItem,
  VirtualizedBlogMemberRequestScrollSeekPlaceholder
} from "..";
import { VirtualizedBlogMemberRequestListProps } from "./list.props";
import { VirtualizedBlogMemberRequestListContext } from "./list-context";

const VirtualizedBlogMemberRequestList = React.memo(
  ({
    blog_member_requests,
    has_more,
    load_more,
    blog_member_request_props,
    className,
    ...rest
  }: VirtualizedBlogMemberRequestListProps) => (
    <VirtualizedBlogMemberRequestListContext.Provider
      value={blog_member_request_props || { role: "editor" }}
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
          Item: VirtualizedBlogMemberRequestItem,
          ScrollSeekPlaceholder:
            VirtualizedBlogMemberRequestScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={blog_member_requests}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedBlogMemberRequestListContext.Provider>
  )
);

VirtualizedBlogMemberRequestList.displayName =
  "VirtualizedBlogMemberRequestList";

export default VirtualizedBlogMemberRequestList;
