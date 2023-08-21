"use client";

import React from "react";

import Divider from "~/components/Divider";
import { FriendRequestSkeleton } from "~/entities/FriendRequest";

const FriendRequestListSkeleton = React.memo(() => (
  <div className={"base"}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <FriendRequestSkeleton />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

FriendRequestListSkeleton.displayName = "FriendRequestListSkeleton";

export default FriendRequestListSkeleton;
