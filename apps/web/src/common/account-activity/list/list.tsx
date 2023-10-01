"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedAccountActivityItem,
  VirtualizedAccountActivityScrollSeekPlaceholder
} from "..";
import { VirtualizedAccountActivityListProps } from "./list.props";
import { VirtualizedAccountActivityListContext } from "./list-context";

const VirtualizedAccountActivityList = React.memo(
  ({
    account_activities,
    has_more,
    load_more,
    account_activity_props = {},
    className,
    ...rest
  }: VirtualizedAccountActivityListProps) => (
    <VirtualizedAccountActivityListContext.Provider
      value={{ account_activity_props, item_count: account_activities.length }}
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
          ...rest?.components,
          Item: VirtualizedAccountActivityItem,
          ScrollSeekPlaceholder:
            VirtualizedAccountActivityScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={account_activities}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedAccountActivityListContext.Provider>
  )
);

VirtualizedAccountActivityList.displayName = "VirtualizedAccountActivityList";

export default VirtualizedAccountActivityList;
