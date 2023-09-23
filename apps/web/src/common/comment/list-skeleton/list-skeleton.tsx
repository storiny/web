"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { CommentSkeleton } from "~/entities/comment";
import { CommentSkeletonProps } from "~/entities/comment/skeleton";

import styles from "../../virtual/virtual.module.scss";

const CommentListSkeleton = React.memo<CommentSkeletonProps>((props) => (
  <div className={clsx("flex-col", styles.list)}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <CommentSkeleton {...props} virtual />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

CommentListSkeleton.displayName = "CommentListSkeleton";

export default CommentListSkeleton;
