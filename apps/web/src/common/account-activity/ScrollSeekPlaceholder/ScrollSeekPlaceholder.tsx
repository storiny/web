"use client";

import { clsx } from "clsx";
import React from "react";

import { AccountActivitySkeleton } from "~/entities/AccountActivity";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedAccountActivityScrollSeekPlaceholder = React.memo(() => (
  <div
    className={clsx("flex-col", styles.x, styles["list-item"], styles.large)}
  >
    <AccountActivitySkeleton />
  </div>
));

VirtualizedAccountActivityScrollSeekPlaceholder.displayName =
  "VirtualizedAccountActivityScrollSeekPlaceholder";

export default VirtualizedAccountActivityScrollSeekPlaceholder;
