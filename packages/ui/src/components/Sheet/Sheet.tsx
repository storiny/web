"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Sheet.module.scss";
import { SheetProps } from "./Sheet.props";

const Sheet = forwardRef<SheetProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    variant = "outlined",
    className,
    children,
    ...rest
  } = props;

  return (
    <Component
      {...rest}
      className={clsx(styles.sheet, styles[variant], className)}
      ref={ref}
    >
      {children}
    </Component>
  );
});

Sheet.displayName = "Sheet";

export default Sheet;
