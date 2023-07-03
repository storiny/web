"use client";

import React from "react";

import Divider from "~/components/Divider";
import { TagSkeleton } from "~/entities/Tag";

const TagListSkeleton = React.memo(() => (
  <div className={"base"}>
    {[...Array(10)].map((_, index) => (
      <React.Fragment key={index}>
        <TagSkeleton />
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
