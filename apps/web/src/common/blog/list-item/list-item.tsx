"use client";

import { Blog as TBlog } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import { VirtualizedBlogListContext } from "~/common/blog/list/list-context";
import Divider from "~/components/divider";
import Blog from "~/entities/blog";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedBlogItem = React.memo(
  ({ item, ...rest }: ItemProps<TBlog>) => {
    // Props from context
    const blog_props = React.useContext(VirtualizedBlogListContext);
    return (
      <div {...rest} className={clsx(css["flex-col"], styles["list-item"])}>
        <Blog {...blog_props} blog={item} virtual />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedBlogItem.displayName = "VirtualizedBlogItem";

export default VirtualizedBlogItem;
