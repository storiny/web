"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "../../../../../../packages/ui/src/components/divider";
import { UserSkeleton } from "~/entities/user";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedUserScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles["list-item"])}>
    <UserSkeleton virtual />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedUserScrollSeekPlaceholder.displayName =
  "VirtualizedUserScrollSeekPlaceholder";

export default VirtualizedUserScrollSeekPlaceholder;
