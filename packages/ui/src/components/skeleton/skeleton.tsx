"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./skeleton.module.scss";
import { SkeletonProps } from "./skeleton.props";

const Skeleton = forward_ref<SkeletonProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    shape = "rectangular",
    no_radius,
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
      className={clsx(
        styles.skeleton,
        styles[shape],
        no_radius && styles["no-radius"],
        className
      )}
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
