"use client";

import { clsx } from "clsx";
import React from "react";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import { TagSkeleton } from "~/entities/tag";
import css from "~/theme/main.module.scss";

const TagListSkeleton = React.memo(() => (
  <div className={clsx(css["flex-col"], styles.list)}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <TagSkeleton virtual />
        <Divider
          className={css["hide-last"]}
          style={{ marginInline: "var(--grid-compensation)" }}
        />
      </React.Fragment>
    ))}
  </div>
));

TagListSkeleton.displayName = "TagListSkeleton";

export default TagListSkeleton;
