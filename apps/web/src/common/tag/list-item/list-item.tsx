"use client";

import { Tag as TTag } from "@storiny/types";
import { clsx } from "clsx";
import React from "react";
import { ItemProps } from "react-virtuoso";

import { VirtualizedTagListContext } from "~/common/tag/list/list-context";
import Divider from "~/components/divider";
import Tag from "~/entities/tag";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedTagItem = React.memo(({ item, ...rest }: ItemProps<TTag>) => {
  // Props from context
  const tag_props = React.useContext(VirtualizedTagListContext);
  return (
    <div
      {...rest}
      className={clsx(css["flex-col"], styles["list-item"])}
      key={item.id}
    >
      <Tag {...tag_props} tag={item} virtual />
      <Divider style={{ marginInline: "var(--grid-compensation)" }} />
    </div>
  );
});

VirtualizedTagItem.displayName = "VirtualizedTagItem";

export default VirtualizedTagItem;
