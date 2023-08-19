"use client";

import { Tag as TTag } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/Divider";
import Tag from "~/entities/Tag";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedTagListContext } from "../List/ListContext";

const VirtualizedTagItem = React.memo(({ item, ...rest }: ItemProps<TTag>) => {
  // Props from context
  const tagProps = React.useContext(VirtualizedTagListContext);

  return (
    <div
      {...rest}
      className={clsx("flex-col", styles.x, styles["list-item"])}
      key={item.id}
    >
      <Tag {...tagProps} tag={item} />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedTagItem.displayName = "VirtualizedTagItem";

export default VirtualizedTagItem;
