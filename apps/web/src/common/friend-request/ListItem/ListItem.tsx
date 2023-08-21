"use client";

import { FriendRequest as TFriendRequest } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/Divider";
import FriendRequest from "~/entities/FriendRequest";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedFriendRequestListContext } from "../List/ListContext";

const VirtualizedFriendRequestItem = React.memo(
  ({ item, ...rest }: ItemProps<TFriendRequest>) => {
    // Props from context
    const friendRequestProps = React.useContext(
      VirtualizedFriendRequestListContext
    );

    return (
      <div
        {...rest}
        className={clsx("flex-col", styles.x, styles["list-item"])}
        key={item.id}
      >
        <FriendRequest {...friendRequestProps} friendRequest={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedFriendRequestItem.displayName = "VirtualizedFriendRequestItem";

export default VirtualizedFriendRequestItem;
