"use client";

import clsx from "clsx";
import React from "react";

import styles from "./svg-icon.module.scss";
import { SvgIconProps } from "./svg-icon.props";

const SvgIcon = React.forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => {
  const {
    no_stroke,
    children,
    className,
    color,
    size,
    rotation,
    viewBox: view_box,
    style,
    ...rest
  } = props;
  return (
    <svg
      {...rest}
      aria-hidden={"true"}
      className={clsx(
        styles["svg-icon"],
        no_stroke && styles["no-stroke"],
        className
      )}
      ref={ref}
      style={
        {
          ...style,
          ...(size && { "--icon-size": `${size}px` }),
          ...(color && { "--icon-stroke": color }),
          // Ignore 0 degree
          ...(rotation && { "--rotation": `${rotation}deg` })
        } as React.CSSProperties
      }
      viewBox={view_box || "0 0 12 12"}
    >
      {children}
    </svg>
  );
});

SvgIcon.displayName = "SvgIcon";

export default SvgIcon;
