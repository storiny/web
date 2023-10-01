"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { ReplySkeleton } from "~/entities/reply";
import css from "~/theme/main.module.scss";

const ReplyListSkeleton = React.memo(({ nested }: { nested?: boolean }) => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <ReplySkeleton virtual />
        {!nested && (
          <Divider
            className={css["hide-last"]}
            style={{ marginInline: "var(--grid-compensation)" }}
          />
        )}
      </React.Fragment>
    ))}
  </div>
));

ReplyListSkeleton.displayName = "ReplyListSkeleton";

export default ReplyListSkeleton;
