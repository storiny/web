"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import { VirtualizedTagItem, VirtualizedTagScrollSeekPlaceholder } from "..";
import { VirtualizedTagListProps } from "./list.props";
import { VirtualizedTagListContext } from "./list-context";

const VirtualizedTagList = React.memo(
  ({
    tags,
    has_more,
    load_more,
    tag_props,
    className,
    ...rest
  }: VirtualizedTagListProps) => (
    <VirtualizedTagListContext.Provider value={tag_props || {}}>
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
          Item: VirtualizedTagItem,
          ScrollSeekPlaceholder: VirtualizedTagScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={tags}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedTagListContext.Provider>
  )
);

VirtualizedTagList.displayName = "VirtualizedTagList";

export default VirtualizedTagList;
