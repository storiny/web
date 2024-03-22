"use client";

import { Blog, Blog as TBlog } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps, Virtuoso, VirtuosoProps } from "react-virtuoso";

import VirtualFooter from "~/common/virtual/footer";
import css from "~/theme/main.module.scss";

import BlogItem from "./item";

export interface BlogListProps extends VirtuosoProps<Blog, any> {
  /**
   * Array of blogs to render.
   */
  blogs: Blog[];
  /**
   * Flag indicating whether there are more blogs to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more blogs.
   */
  load_more: () => void;
}

const VirtualizedBlogItem = React.memo(
  ({ item, ...rest }: ItemProps<TBlog>) => <BlogItem {...rest} blog={item} />
);

VirtualizedBlogItem.displayName = "VirtualizedBlogItem";

const BlogList = React.memo(
  ({ blogs, has_more, load_more, className, ...rest }: BlogListProps) => (
    <Virtuoso
      increaseViewportBy={1800}
      scrollSeekConfiguration={{
        enter: (velocity): boolean => Math.abs(velocity) > 950,
        exit: (velocity): boolean => Math.abs(velocity) < 10
      }}
      {...rest}
      className={clsx(css["full-w"], css["full-h"], className)}
      components={{
        Item: VirtualizedBlogItem,
        ...(has_more && { Footer: VirtualFooter })
      }}
      data={blogs}
      endReached={has_more ? load_more : (): void => undefined}
      useWindowScroll={false}
    />
  )
);

BlogList.displayName = "BlogList";

export default BlogList;
