"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { UserSkeleton } from "~/entities/user";

const UserListSkeleton = React.memo(() => (
  <div className={clsx("flex-col", styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <UserSkeleton virtual />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

UserListSkeleton.displayName = "UserListSkeleton";

export default UserListSkeleton;
