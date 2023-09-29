"use client";

import { clsx } from "clsx";
import React from "react";

import { render_with_state } from "~/redux/mock";

const LayoutWithState = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement =>
  render_with_state(
    <div className={clsx("grid", "grid-container", "dashboard", "no-sidenav")}>
      {children}
    </div>,
    { ignore_primitive_providers: false, logged_in: true }
  );

export default LayoutWithState;
