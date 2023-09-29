"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "../../../../../../packages/ui/src/components/divider";
import { TagSkeleton } from "~/entities/tag";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedTagScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles["list-item"])}>
    <TagSkeleton virtual />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedTagScrollSeekPlaceholder.displayName =
  "VirtualizedTagScrollSeekPlaceholder";

export default VirtualizedTagScrollSeekPlaceholder;
