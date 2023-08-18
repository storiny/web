"use client";

import React from "react";

import Divider from "~/components/Divider";
import { StorySkeleton } from "~/entities/Story";
import { StorySkeletonProps } from "~/entities/Story/Skeleton";

const StoryListSkeleton = React.memo<StorySkeletonProps>((props) => (
  <div className={"base"}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <StorySkeleton {...props} />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

StoryListSkeleton.displayName = "StoryListSkeleton";

export default StoryListSkeleton;
