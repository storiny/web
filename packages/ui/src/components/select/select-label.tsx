"use client";

import clsx from "clsx";
import { Select } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./select-label.module.scss";

const SelectLabel = ({
  children,
  className,
  ...rest
}: Select.SelectLabelProps): React.ReactElement => (
  <Select.Label
    {...rest}
    className={clsx(
      css["t-medium"],
      css["t-minor"],
      styles["select-label"],
      className
    )}
  >
    {children}
  </Select.Label>
);

export type SelectLabelProps = Select.SelectLabelProps;
export default SelectLabel;
