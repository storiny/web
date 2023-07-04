"use client";

import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";

const VirtualizedNotificationFooter = React.memo(() => (
  <div className={clsx("full-w", "flex-col", "flex-center")}>
    <Spacer orientation={"vertical"} size={4} />
    <Spinner />
    <Spacer orientation={"vertical"} size={6} />
  </div>
));

VirtualizedNotificationFooter.displayName = "VirtualizedNotificationFooter";

export default VirtualizedNotificationFooter;
