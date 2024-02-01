import clsx from "clsx";
import React from "react";

import { PlusPatternProps } from "~/brand/plus-pattern/plus-pattern.props";

import styles from "./plus-pattern.module.scss";

const PlusPattern = React.forwardRef<SVGSVGElement, PlusPatternProps>(
  (props, ref) => {
    const { className, ...rest } = props;
    const pattern_id = React.useId();

    return (
      <svg
        aria-hidden={"true"}
        {...rest}
        className={clsx(styles.pattern, className)}
        ref={ref}
      >
        <defs>
          <pattern
            height="60"
            id={pattern_id}
            patternUnits="userSpaceOnUse"
            width="60"
          >
            <path
              className={styles.plus}
              d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"
              fill="var(--inverted-50)"
            />
          </pattern>
        </defs>
        <rect fill={`url(#${pattern_id})`} height="100%" width="100%" />
      </svg>
    );
  }
);

PlusPattern.displayName = "PlusPattern";

export default PlusPattern;
