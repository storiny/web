"use client";

import clsx from "clsx";
import { Select } from "radix-ui";
import React from "react";

import styles from "./select-group.module.scss";

const SelectGroup = ({
  children,
  className,
  ...rest
}: Select.SelectGroupProps): React.ReactElement => (
  <Select.Group {...rest} className={clsx(styles["select-group"], className)}>
    {children}
  </Select.Group>
);

export type SelectGroupProps = Select.SelectGroupProps;
export default SelectGroup;
