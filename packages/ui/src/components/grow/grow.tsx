"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import { GrowProps } from "./grow.props";

const Grow = forward_ref<GrowProps, "span">(
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
