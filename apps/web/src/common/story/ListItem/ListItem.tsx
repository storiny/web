"use client";

import { Story as TStory } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/Divider";
import Story from "~/entities/Story";

import { VirtualizedStoryListContext } from "../List/ListContext";
import styles from "./ListItem.module.scss";

const VirtualizedStoryItem = React.memo(
  ({ item, ...rest }: ItemProps<TStory>) => {
    // Props from context
    const storyProps = React.useContext(VirtualizedStoryListContext);

    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <Story {...storyProps} story={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedStoryItem.displayName = "VirtualizedStoryItem";

export default VirtualizedStoryItem;
