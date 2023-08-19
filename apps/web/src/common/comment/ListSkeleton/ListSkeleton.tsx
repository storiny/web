"use client";

import React from "react";

import Divider from "~/components/Divider";
import { CommentSkeleton } from "~/entities/Comment";
import { CommentSkeletonProps } from "~/entities/Comment/Skeleton";

const CommentListSkeleton = React.memo<CommentSkeletonProps>((props) => (
  <div className={"base"}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <CommentSkeleton {...props} />
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
