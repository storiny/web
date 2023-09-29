"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import VirtualFooter from "../../virtual/footer";
import { VirtualizedUserItem, VirtualizedUserScrollSeekPlaceholder } from "..";
import { VirtualizedUserListProps } from "./list.props";
import { VirtualizedUserListContext } from "./list-context";

const VirtualizedUserList = React.memo(
  ({
    users,
    has_more,
    load_more,
    userProps,
    className,
    ...rest
  }: VirtualizedUserListProps) => (
    <VirtualizedUserListContext.Provider value={userProps || {}}>
      <Virtuoso
        increaseViewportBy={750}
        scrollSeekConfiguration={{
          enter: (velocity): boolean => Math.abs(velocity) > 950,
          exit: (velocity): boolean => Math.abs(velocity) < 10
        }}
        useWindowScroll
        {...rest}
        className={clsx("full-w", "full-h", className)}
        components={{
          Item: VirtualizedUserItem,
          ScrollSeekPlaceholder: VirtualizedUserScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={users}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedUserListContext.Provider>
  )
);

VirtualizedUserList.displayName = "VirtualizedUserList";

export default VirtualizedUserList;
