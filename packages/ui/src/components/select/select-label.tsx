"use client";

import { Label, SelectLabelProps } from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./select-label.module.scss";

const SelectLabel = ({
  children,
  className,
  ...rest
}: SelectLabelProps): React.ReactElement => (
  <Label
    {...rest}
    className={clsx(
      css["t-medium"],
      css["t-minor"],
      styles["select-label"],
      className
    )}
  >
    {children}
  </Label>
);

export type { SelectLabelProps };
export default SelectLabel;
