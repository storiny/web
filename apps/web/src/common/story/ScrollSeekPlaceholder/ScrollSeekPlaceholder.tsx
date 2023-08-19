"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { StorySkeleton } from "~/entities/Story";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedStoryListContext } from "../List/ListContext";

const VirtualizedStoryScrollSeekPlaceholder = React.memo(() => {
  const { skeletonProps } = React.useContext(VirtualizedStoryListContext);
  return (
    <div className={clsx("flex-col", styles.x, styles["list-item"])}>
      <StorySkeleton {...skeletonProps} />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedStoryScrollSeekPlaceholder.displayName =
  "VirtualizedStoryScrollSeekPlaceholder";

export default VirtualizedStoryScrollSeekPlaceholder;
