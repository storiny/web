import { clsx } from "clsx";
import React from "react";

import Typography from "~/components/typography";

import { TypographyPropsWithoutColor } from "../../types";
import styles from "./list.module.scss";

export const LIST = {
  UL: ({
    children,
    className,
    ...rest
  }: React.ComponentPropsWithoutRef<"ul">): React.ReactElement => (
    <ul {...rest} className={clsx(styles.x, styles.list, className)}>
      {children}
    </ul>
  ),
  OL: ({
    children,
    className,
    ...rest
  }: React.ComponentPropsWithoutRef<"ol">): React.ReactElement => (
    <ol {...rest} className={clsx(styles.x, styles.list, className)}>
      {children}
    </ol>
  ),
  LI: ({
    children,
    ...rest
  }: TypographyPropsWithoutColor): React.ReactElement => (
    <Typography {...rest} as={"li"} level={"legible"}>
      {children}
    </Typography>
  )
};
