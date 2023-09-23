"use client";

import { AccountActivity as TAccountActivity } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import AccountActivity from "~/entities/account-activity";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedAccountActivityListContext } from "../list/list-context";

const VirtualizedAccountActivityItem = React.memo(
  ({ item, ...rest }: ItemProps<TAccountActivity>) => {
    // Props from context
    const { accountActivityProps, itemCount } = React.useContext(
      VirtualizedAccountActivityListContext
    );

    return (
      <AccountActivity
        {...rest}
        {...accountActivityProps}
        accountActivity={item}
        className={clsx(styles["list-item"], accountActivityProps?.className)}
        data-last-item={rest["data-item-index"] === itemCount - 1}
        key={item.id}
      />
    );
  }
);

VirtualizedAccountActivityItem.displayName = "VirtualizedAccountActivityItem";

export default VirtualizedAccountActivityItem;
