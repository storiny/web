"use client";

import { Reply as TReply } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import styles from "~/common/virtual/virtual.module.scss";
import Divider from "~/components/divider";
import Reply from "~/entities/reply";

import { VirtualizedReplyListContext } from "../list/list-context";

const VirtualizedReplyItem = React.memo(
  ({ item, ...rest }: ItemProps<TReply>) => {
    // Props from context
    const { reply_props } = React.useContext(VirtualizedReplyListContext);
    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <Reply {...reply_props} reply={item} virtual />
        {!reply_props.nested && (
          <Divider style={{ marginInline: "var(--grid-compensation)" }} />
        )}
      </div>
    );
  }
);

VirtualizedReplyItem.displayName = "VirtualizedReplyItem";

export default VirtualizedReplyItem;
