"use client";

import clsx from "clsx";
import { DropdownMenu } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./separator.module.scss";
import { SeparatorProps } from "./separator.props";

const Separator = forward_ref<SeparatorProps, "div">((props, ref) => {
  const { as: Component = "div", className, invert_margin, ...rest } = props;
  return (
    <DropdownMenu.Separator
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
    </DropdownMenu.Separator>
  );
});

Separator.displayName = "Separator";

export default Separator;
