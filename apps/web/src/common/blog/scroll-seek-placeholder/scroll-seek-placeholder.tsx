"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { BlogSkeleton } from "~/entities/blog";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedBlogScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx(css["flex-col"], styles["list-item"])}>
    <BlogSkeleton virtual />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedBlogScrollSeekPlaceholder.displayName =
  "VirtualizedBlogScrollSeekPlaceholder";

export default VirtualizedBlogScrollSeekPlaceholder;
