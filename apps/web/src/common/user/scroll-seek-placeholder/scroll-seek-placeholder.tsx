"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import { UserSkeleton } from "~/entities/user";
import css from "~/theme/main.module.scss";

import styles from "../../virtual/virtual.module.scss";

const VirtualizedUserScrollSeekPlaceholder = React.memo(() => (
  <div className={clsx(css["flex-col"], styles["list-item"])}>
    <UserSkeleton virtual />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedUserScrollSeekPlaceholder.displayName =
  "VirtualizedUserScrollSeekPlaceholder";

export default VirtualizedUserScrollSeekPlaceholder;
