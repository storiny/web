"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "../../../../../../packages/ui/src/components/divider";
import { NotificationSkeleton } from "~/entities/notification";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedNotificationScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles["list-item"])}>
    <NotificationSkeleton virtual />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedNotificationScrollSeekPlaceholder.displayName =
  "VirtualizedNotificationScrollSeekPlaceholder";

export default VirtualizedNotificationScrollSeekPlaceholder;
