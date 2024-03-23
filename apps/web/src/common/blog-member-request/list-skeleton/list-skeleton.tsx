"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { BlogMemberRequestSkeleton } from "~/entities/blog-member-request";
import css from "~/theme/main.module.scss";

const BlogMemberRequestListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <BlogMemberRequestSkeleton />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

BlogMemberRequestListSkeleton.displayName = "BlogMemberRequestListSkeleton";

export default BlogMemberRequestListSkeleton;
