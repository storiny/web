import { clsx } from "clsx";
import React from "react";

import styles from "./floating-element.module.scss";

const FloatingElementArrow = (): React.ReactElement => (
  <span className={clsx(styles.x, styles.arrow)}>
    <svg
      fill="var(--divider)"
      height="5"
      preserveAspectRatio="none"
      viewBox="0 0 30 10"
      width="15"
    >
      <polygon points="0,0 30,0 15,10"></polygon>
    </svg>
  </span>
);

export default FloatingElementArrow;
