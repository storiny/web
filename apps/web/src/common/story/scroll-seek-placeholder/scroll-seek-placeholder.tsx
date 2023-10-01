"use client";

import { clsx } from "clsx";
import React from "react";

import { VirtualizedStoryListContext } from "~/common/story/list/list-context";
import Divider from "~/components/divider";
import { StorySkeleton } from "~/entities/story";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedStoryScrollSeekPlaceholder = React.memo(() => {
  const { skeleton_props } = React.useContext(VirtualizedStoryListContext);
  return (
    <div className={clsx("flex-col", styles["list-item"])}>
      <StorySkeleton {...skeleton_props} virtual />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedStoryScrollSeekPlaceholder.displayName =
  "VirtualizedStoryScrollSeekPlaceholder";

export default VirtualizedStoryScrollSeekPlaceholder;
