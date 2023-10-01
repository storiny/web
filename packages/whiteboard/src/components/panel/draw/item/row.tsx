import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import styles from "./item.module.scss";

const DrawItemRow = ({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
  <div {...rest} className={clsx(css["flex"], styles.row, className)}>
    {children}
  </div>
);

export default DrawItemRow;
