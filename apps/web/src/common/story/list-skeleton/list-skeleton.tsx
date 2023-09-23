"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/Divider";
import { StorySkeleton } from "~/entities/story";
import { StorySkeletonProps } from "~/entities/story/skeleton";

import styles from "../../virtual/virtual.module.scss";

const StoryListSkeleton = React.memo<StorySkeletonProps>((props) => (
  <div className={clsx("flex-col", styles.list)}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <StorySkeleton {...props} virtual />
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
