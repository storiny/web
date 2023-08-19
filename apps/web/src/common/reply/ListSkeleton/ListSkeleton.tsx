"use client";

import React from "react";

import Divider from "~/components/Divider";
import { ReplySkeleton } from "~/entities/Reply";

const ReplyListSkeleton = React.memo(() => (
  <div className={"base"}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <ReplySkeleton />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

ReplyListSkeleton.displayName = "ReplyListSkeleton";

export default ReplyListSkeleton;
