"use client";

import { FriendRequest as TFriendRequest } from "@storiny/types";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/Divider";
import FriendRequest from "~/entities/friend-request";

import { VirtualizedFriendRequestListContext } from "../list/list-context";

const VirtualizedFriendRequestItem = React.memo(
  ({ item, ...rest }: ItemProps<TFriendRequest>) => {
    // Props from context
    const friendRequestProps = React.useContext(
      VirtualizedFriendRequestListContext
    );

    return (
      <div {...rest} className={"flex-col"} key={item.id}>
        <FriendRequest {...friendRequestProps} friendRequest={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedFriendRequestItem.displayName = "VirtualizedFriendRequestItem";

export default VirtualizedFriendRequestItem;
