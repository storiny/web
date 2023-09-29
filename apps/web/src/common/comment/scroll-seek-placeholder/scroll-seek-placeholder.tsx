"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "../../../../../../packages/ui/src/components/divider";
import { CommentSkeleton } from "~/entities/comment";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedCommentListContext } from "../list/list-context";

const VirtualizedCommentScrollSeekPlaceholder = React.memo(() => {
  const { skeletonProps } = React.useContext(VirtualizedCommentListContext);
  return (
    <div className={clsx("flex-col", styles["list-item"])}>
      <CommentSkeleton {...skeletonProps} virtual />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedCommentScrollSeekPlaceholder.displayName =
  "VirtualizedCommentScrollSeekPlaceholder";

export default VirtualizedCommentScrollSeekPlaceholder;
