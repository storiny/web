"use client";

import { BlogRequest as TBlogRequest } from "@storiny/types";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import BlogRequest from "~/entities/blog-request";
import css from "~/theme/main.module.scss";

import { VirtualizedBlogRequestListContext } from "../list/list-context";

const VirtualizedBlogRequestItem = React.memo(
  ({ item, ...rest }: ItemProps<TBlogRequest>) => {
    // Props from context
    const blog_request_props = React.useContext(
      VirtualizedBlogRequestListContext
    );
    return (
      <div {...rest} className={css["flex-col"]}>
        <BlogRequest {...blog_request_props} blog_request={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedBlogRequestItem.displayName = "VirtualizedBlogRequestItem";

export default VirtualizedBlogRequestItem;
