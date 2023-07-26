import clsx from "clsx";
import React from "react";

import styles from "./Item.module.scss";

const DrawItemRow = ({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"div">): React.ReactElement => (
  <div {...rest} className={clsx("flex", styles.x, styles.row, className)}>
    {children}
  </div>
);

export default DrawItemRow;
