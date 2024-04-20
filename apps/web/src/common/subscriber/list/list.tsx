"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedSubscriberItem,
  VirtualizedSubscriberScrollSeekPlaceholder
} from "..";
import { VirtualizedSubscriberListProps } from "./list.props";
import { VirtualizedSubscriberListContext } from "./list-context";

const VirtualizedSubscriberList = React.memo(
  ({
    subscribers,
    has_more,
    load_more,
    subscriber_props = {},
    className,
    ...rest
  }: VirtualizedSubscriberListProps) => (
    <VirtualizedSubscriberListContext.Provider value={subscriber_props}>
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
          ...rest?.components,
          Item: VirtualizedSubscriberItem,
          ScrollSeekPlaceholder: VirtualizedSubscriberScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={subscribers}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedSubscriberListContext.Provider>
  )
);

VirtualizedSubscriberList.displayName = "VirtualizedSubscriberList";

export default VirtualizedSubscriberList;
