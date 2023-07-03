"use client";

import React from "react";

import Divider from "~/components/Divider";
import { UserSkeleton } from "~/entities/User";

const UserListSkeleton = React.memo(() => (
  <div className={"base"}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <UserSkeleton />
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
