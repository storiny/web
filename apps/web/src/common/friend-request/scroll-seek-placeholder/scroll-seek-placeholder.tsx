"use client";

import React from "react";

import Divider from "~/components/divider";
import { FriendRequestSkeleton } from "~/entities/friend-request";
import css from "~/theme/main.module.scss";

const VirtualizedFriendRequestScrollSeekPlaceholder = React.memo(() => (
  <div className={css["flex-col"]}>
    <FriendRequestSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedFriendRequestScrollSeekPlaceholder.displayName =
  "VirtualizedFriendRequestScrollSeekPlaceholder";

export default VirtualizedFriendRequestScrollSeekPlaceholder;
