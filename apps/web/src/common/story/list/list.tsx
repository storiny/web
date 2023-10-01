"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedStoryItem,
  VirtualizedStoryScrollSeekPlaceholder
} from "..";
import { VirtualizedStoryListProps } from "./list.props";
import { VirtualizedStoryListContext } from "./list-context";

const VirtualizedStoryList = React.memo(
  ({
    stories,
    has_more,
    load_more,
    story_props = {},
    skeleton_props = {},
    className,
    ...rest
  }: VirtualizedStoryListProps) => (
    <VirtualizedStoryListContext.Provider
      value={{ story_props, skeleton_props }}
    >
      <Virtuoso
        increaseViewportBy={750}
        scrollSeekConfiguration={{
          enter: (velocity): boolean => Math.abs(velocity) > 950,
          exit: (velocity): boolean => Math.abs(velocity) < 10
        }}
        useWindowScroll
        {...rest}
        className={clsx(css["full-w"], css["full-h"], className)}
        components={{
          Item: VirtualizedStoryItem,
          ScrollSeekPlaceholder: VirtualizedStoryScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={stories}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedStoryListContext.Provider>
  )
);

VirtualizedStoryList.displayName = "VirtualizedStoryList";

export default VirtualizedStoryList;
