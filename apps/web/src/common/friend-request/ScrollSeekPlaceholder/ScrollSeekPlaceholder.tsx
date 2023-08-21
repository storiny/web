"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { FriendRequestSkeleton } from "~/entities/FriendRequest";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedFriendRequestScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx("flex-col", styles.x, styles["list-item"])}>
    <FriendRequestSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedFriendRequestScrollSeekPlaceholder.displayName =
  "VirtualizedFriendRequestScrollSeekPlaceholder";

export default VirtualizedFriendRequestScrollSeekPlaceholder;
