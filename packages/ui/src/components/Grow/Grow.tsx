"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import { GrowProps } from "./Grow.props";

const Grow = forwardRef<GrowProps, "span">(
  ({ as: Component = "span", className, ...rest }, ref) => (
    <Component
      {...rest}
      aria-hidden={"true"}
      className={clsx("f-grow", className)}
      ref={ref}
    />
  )
);

Grow.displayName = "Grow";

export default Grow;
