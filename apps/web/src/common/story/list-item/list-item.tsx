"use client";

import { Story as TStory } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "../../../../../../packages/ui/src/components/divider";
import Story from "~/entities/story";

import { VirtualizedStoryListContext } from "../list/list-context";

const VirtualizedStoryItem = React.memo(
  ({ item, ...rest }: ItemProps<TStory>) => {
    // Props from context
    const { story_props } = React.useContext(VirtualizedStoryListContext);
    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <Story {...story_props} story={item} virtual />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedStoryItem.displayName = "VirtualizedStoryItem";

export default VirtualizedStoryItem;
