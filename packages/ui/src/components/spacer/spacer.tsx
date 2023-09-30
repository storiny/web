"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./spacer.module.scss";
import { SpacerProps } from "./spacer.props";

const Spacer = forward_ref<SpacerProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    size = 1,
    orientation = "horizontal",
    inline,
    className,
    style,
    ...rest
  } = props;
  return (
    <Component
      {...rest}
      aria-hidden
      className={clsx(
        styles.spacer,
        styles[orientation],
        inline && styles.inline,
        className
      )}
      ref={ref}
      style={{ ...style, "--size": size } as React.CSSProperties}
    />
  );
});

Spacer.displayName = "Spacer";

export default Spacer;
