"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { NotificationSkeleton } from "~/entities/Notification";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedNotificationScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles.x, styles["list-item"])}>
    <NotificationSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedNotificationScrollSeekPlaceholder.displayName =
  "VirtualizedNotificationScrollSeekPlaceholder";

export default VirtualizedNotificationScrollSeekPlaceholder;
