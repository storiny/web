"use client";

import { clsx } from "clsx";
import React from "react";

import { VirtualizedStoryListContext } from "~/common/story/list/list-context";
import Divider from "../../../../../../packages/ui/src/components/divider";
import { StorySkeleton } from "~/entities/story";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedStoryScrollSeekPlaceholder = React.memo(() => {
  const { skeletonProps } = React.useContext(VirtualizedStoryListContext);
  return (
    <div className={clsx("flex-col", styles["list-item"])}>
      <StorySkeleton {...skeletonProps} virtual />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedStoryScrollSeekPlaceholder.displayName =
  "VirtualizedStoryScrollSeekPlaceholder";

export default VirtualizedStoryScrollSeekPlaceholder;
