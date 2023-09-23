"use client";

import { Reply as TReply } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/Divider";
import Reply from "~/entities/reply";

import { VirtualizedReplyListContext } from "../list/list-context";

const VirtualizedReplyItem = React.memo(
  ({ item, ...rest }: ItemProps<TReply>) => {
    // Props from context
    const { replyProps } = React.useContext(VirtualizedReplyListContext);

    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <Reply {...replyProps} reply={item} virtual />
        {!replyProps.nested && (
          <Divider style={{ marginInline: "var(--grid-compensation)" }} />
        )}
      </div>
    );
  }
);

VirtualizedReplyItem.displayName = "VirtualizedReplyItem";

export default VirtualizedReplyItem;
