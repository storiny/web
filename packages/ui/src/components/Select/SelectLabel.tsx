import { Label, SelectLabelProps } from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import styles from "./SelectLabel.module.scss";

const SelectLabel = ({
  children,
  className,
  ...rest
}: SelectLabelProps): React.ReactElement => (
  <Label
    {...rest}
    className={clsx("t-medium", "t-minor", styles["select-label"], className)}
  >
    {children}
  </Label>
);

export type { SelectLabelProps };
export default SelectLabel;
