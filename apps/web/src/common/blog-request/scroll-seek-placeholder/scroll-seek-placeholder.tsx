"use client";

import React from "react";

import Divider from "~/components/divider";
import { BlogRequestSkeleton } from "~/entities/blog-request";
import css from "~/theme/main.module.scss";

const VirtualizedBlogRequestScrollSeekPlaceholder = React.memo(() => (
  <div className={css["flex-col"]}>
    <BlogRequestSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedBlogRequestScrollSeekPlaceholder.displayName =
  "VirtualizedBlogRequestScrollSeekPlaceholder";

export default VirtualizedBlogRequestScrollSeekPlaceholder;
