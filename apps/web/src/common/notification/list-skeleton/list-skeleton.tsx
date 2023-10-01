"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { NotificationSkeleton } from "~/entities/notification";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const NotificationListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <NotificationSkeleton virtual />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

NotificationListSkeleton.displayName = "NotificationListSkeleton";

export default NotificationListSkeleton;
