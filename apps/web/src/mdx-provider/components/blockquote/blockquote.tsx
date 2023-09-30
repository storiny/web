import { clsx } from "clsx";
import React from "react";

import styles from "./blockquote.module.scss";

const Blockquote = ({
  children,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"blockquote">): React.ReactElement => (
  <blockquote
    {...rest}
    className={clsx("t-legible-slim", styles.blockquote, className)}
  >
    {children}
  </blockquote>
);

export default Blockquote;
