import { clsx } from "clsx";
import React from "react";

import styles from "./table.module.scss";

const Table = ({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"table">): React.ReactElement => (
  <div className={clsx(styles.table, className)}>
    <table {...rest}>{children}</table>
  </div>
);

export default Table;
