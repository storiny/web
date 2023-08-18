"use client";

import { clsx } from "clsx";
import React from "react";

import { VirtualizedStoryListContext } from "~/common/story/List/ListContext";
import Divider from "~/components/Divider";
import { StorySkeleton } from "~/entities/Story";

import styles from "../ListItem/ListItem.module.scss";

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
