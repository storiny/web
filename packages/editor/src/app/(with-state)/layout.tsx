"use client";

import { clsx } from "clsx";
import React from "react";

import { render_with_state } from "~/redux/mock";
import css from "~/theme/main.module.scss";

const LayoutWithState = ({
  children
}: {
  children: React.ReactNode;
}): React.ReactElement =>
  render_with_state(
    <div
      className={clsx(
        css["grid"],
        css["grid-container"],
        css["dashboard"],
        css["no-sidenav"]
      )}
    >
      {children}
    </div>,
    {
      ignore_primitive_providers: false,
      ignore_initializer: true,
      logged_in: true
    }
  );

export default LayoutWithState;
