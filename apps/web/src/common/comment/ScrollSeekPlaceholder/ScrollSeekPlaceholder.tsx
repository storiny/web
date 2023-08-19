"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { CommentSkeleton } from "~/entities/Comment";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedCommentListContext } from "../List/ListContext";

const VirtualizedCommentScrollSeekPlaceholder = React.memo(() => {
  const { skeletonProps } = React.useContext(VirtualizedCommentListContext);
  return (
    <div className={clsx("flex-col", styles.x, styles["list-item"])}>
      <CommentSkeleton {...skeletonProps} />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedCommentScrollSeekPlaceholder.displayName =
  "VirtualizedCommentScrollSeekPlaceholder";

export default VirtualizedCommentScrollSeekPlaceholder;
