"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { ReplySkeleton } from "~/entities/Reply";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedReplyScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles.x, styles["list-item"])}>
    <ReplySkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedReplyScrollSeekPlaceholder.displayName =
  "VirtualizedReplyScrollSeekPlaceholder";

export default VirtualizedReplyScrollSeekPlaceholder;
