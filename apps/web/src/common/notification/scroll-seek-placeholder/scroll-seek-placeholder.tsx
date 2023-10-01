"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { NotificationSkeleton } from "~/entities/notification";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedNotificationScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx(css["flex-col"], styles["list-item"])}>
    <NotificationSkeleton virtual />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedNotificationScrollSeekPlaceholder.displayName =
  "VirtualizedNotificationScrollSeekPlaceholder";

export default VirtualizedNotificationScrollSeekPlaceholder;
