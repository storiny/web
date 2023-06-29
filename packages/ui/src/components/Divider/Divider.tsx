"use client";

import { Root } from "@radix-ui/react-separator";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Divider.module.scss";
import { DividerProps } from "./Divider.props";

const Divider = forwardRef<DividerProps, "div">((props, ref) => {
  const { as: Component = "div", className, ...rest } = props;

  return (
    <Root
      asChild
      className={clsx(styles.reset, styles.divider, className)}
      ref={ref}
      {...rest}
    >
      <Component />
    </Root>
  );
});

Divider.displayName = "Divider";

export default Divider;
