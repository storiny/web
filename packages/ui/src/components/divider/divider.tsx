"use client";

import { Root } from "@radix-ui/react-separator";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";

import styles from "./divider.module.scss";
import { DividerProps } from "./divider.props";

const Divider = forward_ref<DividerProps, "div">((props, ref) => {
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
