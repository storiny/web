"use client";

import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";

const VirtualFooter = React.memo(() => (
  <div className={clsx("full-w", "flex-col", "flex-center")}>
    <Spacer orientation={"vertical"} size={4} />
    <Spinner aria-label={"Loading more…"} />
    <Spacer orientation={"vertical"} size={6} />
  </div>
));

VirtualFooter.displayName = "VirtualFooter";

export default VirtualFooter;
