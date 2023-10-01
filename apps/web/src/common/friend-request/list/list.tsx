"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedFriendRequestItem,
  VirtualizedFriendRequestScrollSeekPlaceholder
} from "..";
import { VirtualizedFriendRequestListProps } from "./list.props";
import { VirtualizedFriendRequestListContext } from "./list-context";

const VirtualizedFriendRequestList = React.memo(
  ({
    friend_requests,
    has_more,
    load_more,
    friend_request_props,
    className,
    ...rest
  }: VirtualizedFriendRequestListProps) => (
    <VirtualizedFriendRequestListContext.Provider
      value={friend_request_props || {}}
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
          Item: VirtualizedFriendRequestItem,
          ScrollSeekPlaceholder: VirtualizedFriendRequestScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={friend_requests}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedFriendRequestListContext.Provider>
  )
);

VirtualizedFriendRequestList.displayName = "VirtualizedFriendRequestList";

export default VirtualizedFriendRequestList;
