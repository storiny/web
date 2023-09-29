"use client";

import { Tag as TTag } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import { VirtualizedTagListContext } from "~/common/tag/list/list-context";
import Divider from "../../../../../../packages/ui/src/components/divider";
import Tag from "~/entities/tag";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedTagItem = React.memo(({ item, ...rest }: ItemProps<TTag>) => {
  // Props from context
  const tagProps = React.useContext(VirtualizedTagListContext);

  return (
    <div
      {...rest}
      className={clsx("flex-col", styles["list-item"])}
      key={item.id}
    >
      <Tag {...tagProps} tag={item} virtual />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedTagItem.displayName = "VirtualizedTagItem";

export default VirtualizedTagItem;
