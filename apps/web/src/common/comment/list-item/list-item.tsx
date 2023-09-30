"use client";

import { Comment as TComment } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "../../../../../../packages/ui/src/components/divider";
import Comment from "~/entities/comment";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedCommentListContext } from "../list/list-context";

const VirtualizedCommentItem = React.memo(
  ({ item, ...rest }: ItemProps<TComment>) => {
    // Props from context
    const { comment_props } = React.useContext(VirtualizedCommentListContext);
    return (
      <div
        {...rest}
        className={clsx("flex-col", styles["list-item"])}
        key={item.id}
      >
        <Comment {...comment_props} comment={item} virtual />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedCommentItem.displayName = "VirtualizedCommentItem";

export default VirtualizedCommentItem;
