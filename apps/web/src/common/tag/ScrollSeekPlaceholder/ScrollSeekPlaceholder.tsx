"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { TagSkeleton } from "~/entities/Tag";

import styles from "../ListItem/ListItem.module.scss";

const VirtualizedTagScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles.x, styles["list-item"])}>
    <TagSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedTagScrollSeekPlaceholder.displayName =
  "VirtualizedTagScrollSeekPlaceholder";

export default VirtualizedTagScrollSeekPlaceholder;
