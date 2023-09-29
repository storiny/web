"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "../../../../../../packages/ui/src/components/divider";
import { ReplySkeleton } from "~/entities/reply";

const ReplyListSkeleton = React.memo(({ nested }: { nested?: boolean }) => (
  <div className={clsx("flex-col", styles.list)}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <ReplySkeleton virtual />
        {!nested && (
          <Divider
            className={"hide-last"}
            style={{ marginInline: "var(--grid-compensation)" }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
));

ReplyListSkeleton.displayName = "ReplyListSkeleton";

export default ReplyListSkeleton;
