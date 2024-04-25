"use client";

import React from "react";

import Divider from "~/components/divider";
import { SubscriberSkeleton } from "~/entities/subscriber";
import css from "~/theme/main.module.scss";

const VirtualizedSubscriberScrollSeekPlaceholder = React.memo(() => (
  <div className={css["flex-col"]}>
    <SubscriberSkeleton />
    <Divider style={{ marginInline: "var(--grid-compensation)" }} />
  </div>
));

VirtualizedSubscriberScrollSeekPlaceholder.displayName =
  "VirtualizedSubscriberScrollSeekPlaceholder";

export default VirtualizedSubscriberScrollSeekPlaceholder;
