"use client";

import React from "react";

import { AccountActivitySkeleton } from "~/entities/AccountActivity";

const AccountActivityListSkeleton = React.memo(() => (
  <div className={"base"} style={{ gap: "42px" }}>
    {[...Array(10)].map((_, index) => (
      <AccountActivitySkeleton data-last-item={index === 9} key={index} />
    ))}
  </div>
));

AccountActivityListSkeleton.displayName = "AccountActivityListSkeleton";

export default AccountActivityListSkeleton;
