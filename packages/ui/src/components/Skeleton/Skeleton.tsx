"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Skeleton.module.scss";
import { SkeletonProps } from "./Skeleton.props";

const Skeleton = forwardRef<SkeletonProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    shape = "rectangular",
    width,
    height,
    className,
    style,
    ...rest
  } = props;

  return (
    <Component
      {...rest}
      aria-hidden={"true"}
      className={clsx(styles.skeleton, styles[shape], className)}
      ref={ref}
      style={{
        ...style,
        ...(typeof width !== "undefined" && {
          "--width": `${width}px`
        }),
        ...(typeof height !== "undefined" && {
          "--height": `${height}px`
        })
      }}
    />
  );
});

Skeleton.displayName = "Skeleton";

export default Skeleton;
