"use client";

import { Separator as SeparatorPrimitive } from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Separator.module.scss";
import { SeparatorProps } from "./Separator.props";

const Separator = forwardRef<SeparatorProps, "div">((props, ref) => {
  const { as: Component = "div", className, invertMargin, ...rest } = props;

  return (
    <SeparatorPrimitive
      {...rest}
      asChild
      className={clsx(
        styles.separator,
        invertMargin && styles["invert-margin"],
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
