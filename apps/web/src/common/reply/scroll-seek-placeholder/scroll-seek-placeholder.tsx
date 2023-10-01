"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { ReplySkeleton } from "~/entities/reply";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";
import { VirtualizedReplyListContext } from "../list/list-context";

const VirtualizedReplyScrollSeekPlaceholder = React.memo(() => {
  const { skeleton_props } = React.useContext(VirtualizedReplyListContext);
  return (
    <div className={clsx(css["flex-col"], styles["list-item"])}>
      <ReplySkeleton {...skeleton_props} virtual />
      {!skeleton_props.nested && (
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      )}
    </div>
  );
});

VirtualizedReplyScrollSeekPlaceholder.displayName =
  "VirtualizedReplyScrollSeekPlaceholder";

export default VirtualizedReplyScrollSeekPlaceholder;
