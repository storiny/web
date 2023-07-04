"use client";

import React from "react";

import Divider from "~/components/Divider";
import { NotificationSkeleton } from "~/entities/Notification";

const NotificationListSkeleton = React.memo(() => (
  <div className={"base"}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <NotificationSkeleton />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

NotificationListSkeleton.displayName = "NotificationListSkeleton";

export default NotificationListSkeleton;
