"use client";

import { clsx } from "clsx";
import React from "react";

import { renderWithState } from "~/redux/mock";

const LayoutWithState = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement =>
  renderWithState(
    <div className={clsx("grid", "grid-container", "dashboard", "no-sidenav")}>
      {children}
    </div>,
    { ignorePrimitiveProviders: false, loggedIn: true }
  );

export default LayoutWithState;
