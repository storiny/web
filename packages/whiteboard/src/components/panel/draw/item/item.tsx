import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

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
      css["flex-col"],
      styles.item,
      Boolean(label) && styles["has-label"],
      className
    )}
  >
    {label && (
      <Typography
        className={clsx(styles.x, styles.label)}
        color={"minor"}
        weight={"bold"}
      >
        {label}
      </Typography>
    )}
    {children}
  </div>
);

export default DrawItem;
