"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { FriendRequestSkeleton } from "~/entities/friend-request";

const FriendRequestListSkeleton = React.memo(() => (
  <div className={clsx("flex-col", styles.list)}>
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
