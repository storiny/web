"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { StorySkeleton } from "~/entities/story";
import { StorySkeletonProps } from "~/entities/story/skeleton";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const StoryListSkeleton = React.memo<StorySkeletonProps>((props) => (
  <div className={clsx(css["flex-col"], styles.list)} style={{ paddingTop: 0 }}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <StorySkeleton {...props} virtual />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

StoryListSkeleton.displayName = "StoryListSkeleton";

export default StoryListSkeleton;
