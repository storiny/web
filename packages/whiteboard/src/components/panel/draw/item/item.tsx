import clsx from "clsx";
import React from "react";

import Typography from "~/components/Typography";

import styles from "./item.module.scss";
import { DrawItemProps } from "./item.props";

const DrawItem = ({
  children,
  className,
  label,
  ...rest
}: DrawItemProps): React.ReactElement => (
  <div
    {...rest}
    className={clsx(
      "flex-col",
      styles.x,
      styles.item,
      Boolean(label) && styles["has-label"],
      className
    )}
  >
    {label && (
      <Typography className={clsx("t-bold", "t-minor", styles.x, styles.label)}>
        {label}
      </Typography>
    )}
    {children}
  </div>
);

export default DrawItem;
