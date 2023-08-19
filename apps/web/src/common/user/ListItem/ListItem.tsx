"use client";

import { User as TUser } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/Divider";
import User from "~/entities/User";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedUserListContext } from "../List/ListContext";

const VirtualizedUserItem = React.memo(
  ({ item, ...rest }: ItemProps<TUser>) => {
    // Props from context
    const userProps = React.useContext(VirtualizedUserListContext);

    return (
      <div
        {...rest}
        className={clsx("flex-col", styles.x, styles["list-item"])}
        key={item.id}
      >
        <User {...userProps} user={item} />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedUserItem.displayName = "VirtualizedUserItem";

export default VirtualizedUserItem;
