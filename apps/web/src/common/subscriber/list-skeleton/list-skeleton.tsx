"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { SubscriberSkeleton } from "~/entities/subscriber";
import css from "~/theme/main.module.scss";

const SubscriberListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <SubscriberSkeleton />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

SubscriberListSkeleton.displayName = "SubscriberListSkeleton";

export default SubscriberListSkeleton;
