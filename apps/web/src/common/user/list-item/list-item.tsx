"use client";

import { User as TUser } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import User from "~/entities/user";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedUserListContext } from "../list/list-context";

const VirtualizedUserItem = React.memo(
  ({ item, ...rest }: ItemProps<TUser>) => {
    // Props from context
    const user_props = React.useContext(VirtualizedUserListContext);
    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <User {...user_props} user={item} virtual />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedUserItem.displayName = "VirtualizedUserItem";

export default VirtualizedUserItem;
