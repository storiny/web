"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { TagSkeleton } from "~/entities/tag";

const TagListSkeleton = React.memo(() => (
  <div className={clsx("flex-col", styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <TagSkeleton virtual />
        <Divider
          className={"hide-last"}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

TagListSkeleton.displayName = "TagListSkeleton";

export default TagListSkeleton;
