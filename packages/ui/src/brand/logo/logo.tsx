"use client";

import clsx from "clsx";
import React from "react";

import styles from "./logo.module.scss";
import { LogoProps } from "./logo.props";

const Logo = React.forwardRef<SVGSVGElement, LogoProps>((props, ref) => {
  const { className, size = 64, style, ...rest } = props;
  return (
    <svg
      {...rest}
      aria-hidden={"true"}
      className={clsx(styles.logo, className)}
      ref={ref}
      style={{ ...style, "--size": `${size}px` } as React.CSSProperties}
      viewBox="0 0 64 64"
    >
      <path
        d="M41.98 9.64a11.5 11.5 0 1 0-7.05 16.88l8.06 13.96a11.5 11.5 0 1 0 5.27-3.05l-8.05-13.96a11.5 11.5 0 0 0 1.77-13.83ZM12.82 60.12a11.5 11.5 0 1 0 0-23 11.5 11.5 0 0 0 0 23Z"
        fill={"currentColor"}
      />
    </svg>
  );
});

Logo.displayName = "Logo";

export default Logo;
