"use client";

import React from "react";

import Divider from "~/components/Divider";
import { FriendRequestSkeleton } from "~/entities/friend-request";

const VirtualizedFriendRequestScrollSeekPlaceholder = React.memo(() => (
  <div className={"flex-col"}>
    <FriendRequestSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedFriendRequestScrollSeekPlaceholder.displayName =
  "VirtualizedFriendRequestScrollSeekPlaceholder";

export default VirtualizedFriendRequestScrollSeekPlaceholder;
