"use client";

import { AccountActivity as TAccountActivity } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import AccountActivity from "~/entities/AccountActivity";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedAccountActivityListContext } from "../List/ListContext";

const VirtualizedAccountActivityItem = React.memo(
  ({ item, ...rest }: ItemProps<TAccountActivity>) => {
    // Props from context
    const { accountActivityProps, itemCount } = React.useContext(
      VirtualizedAccountActivityListContext
    );

    return (
      <div
        {...rest}
        className={clsx(
          "flex-col",
          styles.x,
          styles["list-item"],
          styles.large
        )}
        key={item.id}
      >
        <AccountActivity
          {...accountActivityProps}
          accountActivity={item}
          data-last-item={rest["data-item-index"] === itemCount - 1}
        />
      </div>
    );
  }
);

VirtualizedAccountActivityItem.displayName = "VirtualizedAccountActivityItem";

export default VirtualizedAccountActivityItem;
