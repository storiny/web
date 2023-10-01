"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { CommentSkeleton } from "~/entities/comment";
import { CommentSkeletonProps } from "~/entities/comment/skeleton";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const CommentListSkeleton = React.memo<CommentSkeletonProps>((props) => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <CommentSkeleton {...props} virtual />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

CommentListSkeleton.displayName = "CommentListSkeleton";

export default CommentListSkeleton;
