"use client";

import { clsx } from "clsx";
import React from "react";

import { AccountActivitySkeleton } from "~/entities/account-activity";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const AccountActivityListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <AccountActivitySkeleton data-last-item={index === 9} key={index} />
    ))}
  </div>
));

AccountActivityListSkeleton.displayName = "AccountActivityListSkeleton";

export default AccountActivityListSkeleton;
