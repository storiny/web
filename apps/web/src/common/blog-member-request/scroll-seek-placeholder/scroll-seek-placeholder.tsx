"use client";

import React from "react";

import Divider from "~/components/divider";
import { BlogMemberRequestSkeleton } from "~/entities/blog-member-request";
import css from "~/theme/main.module.scss";

const VirtualizedBlogMemberRequestScrollSeekPlaceholder = React.memo(() => (
  <div className={css["flex-col"]}>
    <BlogMemberRequestSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedBlogMemberRequestScrollSeekPlaceholder.displayName =
  "VirtualizedBlogMemberRequestScrollSeekPlaceholder";

export default VirtualizedBlogMemberRequestScrollSeekPlaceholder;
