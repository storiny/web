"use client";

import { Separator as SeparatorPrimitive } from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";

import styles from "./separator.module.scss";
import { SeparatorProps } from "./separator.props";

const Separator = forward_ref<SeparatorProps, "div">((props, ref) => {
  const { as: Component = "div", className, invert_margin, ...rest } = props;
  return (
    <SeparatorPrimitive
      {...rest}
      asChild
      className={clsx(
        styles.separator,
        invert_margin && styles["invert-margin"],
        className
      )}
      ref={ref}
    >
      <Component />
    </SeparatorPrimitive>
  );
});

Separator.displayName = "Separator";

export default Separator;
