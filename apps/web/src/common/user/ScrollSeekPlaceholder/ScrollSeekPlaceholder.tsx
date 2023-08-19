"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { UserSkeleton } from "~/entities/User";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedUserScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles.x, styles["list-item"])}>
    <UserSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedUserScrollSeekPlaceholder.displayName =
  "VirtualizedUserScrollSeekPlaceholder";

export default VirtualizedUserScrollSeekPlaceholder;
