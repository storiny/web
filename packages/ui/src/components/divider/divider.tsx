"use client";

import clsx from "clsx";
import { Separator } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./divider.module.scss";
import { DividerProps } from "./divider.props";

const Divider = forward_ref<DividerProps, "div">((props, ref) => {
  const { as: Component = "div", className, ...rest } = props;
  return (
    <Separator.Root
      asChild
      className={clsx(styles.reset, styles.divider, className)}
      ref={ref}
      {...rest}
    >
      <Component />
    </Separator.Root>
  );
});

Divider.displayName = "Divider";

export default Divider;
