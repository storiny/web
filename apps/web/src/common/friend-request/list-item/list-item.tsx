"use client";

import { FriendRequest as TFriendRequest } from "@storiny/types";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import FriendRequest from "~/entities/friend-request";
import css from "~/theme/main.module.scss";

import { VirtualizedFriendRequestListContext } from "../list/list-context";

const VirtualizedFriendRequestItem = React.memo(
  ({ item, ...rest }: ItemProps<TFriendRequest>) => {
    // Props from context
    const friend_request_props = React.useContext(
      VirtualizedFriendRequestListContext
    );
    return (
      <div {...rest} className={css["flex-col"]}>
        <FriendRequest {...friend_request_props} friend_request={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedFriendRequestItem.displayName = "VirtualizedFriendRequestItem";

export default VirtualizedFriendRequestItem;
