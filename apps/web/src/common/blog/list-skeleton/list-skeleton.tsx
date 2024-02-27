"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { BlogSkeleton } from "~/entities/blog";
import css from "~/theme/main.module.scss";

const BlogListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <BlogSkeleton virtual />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

BlogListSkeleton.displayName = "BlogListSkeleton";

export default BlogListSkeleton;
