"use client";

import clsx from "clsx";
import React from "react";

import styles from "./SvgIcon.module.scss";
import { SvgIconProps } from "./SvgIcon.props";

const SvgIcon = React.forwardRef<SVGSVGElement, SvgIconProps>((props, ref) => {
  const {
    noStroke,
    children,
    className,
    color,
    size,
    rotation,
    viewBox = "0 0 12 12",
    style,
    ...rest
  } = props;

  return (
    <svg
      {...rest}
      aria-hidden={"true"}
      className={clsx(
        styles["svg-icon"],
        noStroke && styles["no-stroke"],
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
      viewBox={viewBox}
    >
      {children}
    </svg>
  );
});

SvgIcon.displayName = "SvgIcon";

export default SvgIcon;
