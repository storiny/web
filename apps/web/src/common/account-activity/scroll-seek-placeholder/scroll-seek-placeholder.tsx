"use client";

import React from "react";

import { AccountActivitySkeleton } from "~/entities/account-activity";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedAccountActivityScrollSeekPlaceholder = React.memo(() => (
  <AccountActivitySkeleton className={styles["list-item"]} />
));

VirtualizedAccountActivityScrollSeekPlaceholder.displayName =
  "VirtualizedAccountActivityScrollSeekPlaceholder";

export default VirtualizedAccountActivityScrollSeekPlaceholder;
