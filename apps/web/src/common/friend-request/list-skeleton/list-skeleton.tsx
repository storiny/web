"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { FriendRequestSkeleton } from "~/entities/friend-request";
import css from "~/theme/main.module.scss";

const FriendRequestListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <FriendRequestSkeleton />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

FriendRequestListSkeleton.displayName = "FriendRequestListSkeleton";

export default FriendRequestListSkeleton;
