import { Group, SelectGroupProps } from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import styles from "./SelectGroup.module.scss";

const SelectGroup = ({
  children,
  className,
  ...rest
}: SelectGroupProps): React.ReactElement => (
  <Group {...rest} className={clsx(styles["select-group"], className)}>
    {children}
  </Group>
);

export type { SelectGroupProps };
export default SelectGroup;
