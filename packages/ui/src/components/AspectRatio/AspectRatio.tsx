"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./AspectRatio.module.scss";
import { AspectRatioProps } from "./AspectRatio.props";

const AspectRatio = forwardRef<AspectRatioProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    ratio = 1,
    children,
    objectFit = "cover",
    className,
    slotProps,
    style,
    ...rest
  } = props;

  return (
    <Component
      {...rest}
      className={clsx(styles["aspect-ratio"], className)}
      ref={ref}
      style={
        {
          ...style,
          "--object-fit": objectFit,
          "--padding": `${(100 / ratio).toFixed(3)}%`
        } as React.CSSProperties
      }
    >
      <div
        {...slotProps?.wrapper}
        className={clsx(styles.wrapper, slotProps?.wrapper?.className)}
      >
        {React.Children.map(children, (child, index) =>
          index === 0 && React.isValidElement(child)
            ? React.cloneElement(child, { "data-first-child": "" } as Record<
                string,
                string
              >)
            : child
        )}
      </div>
    </Component>
  );
});

AspectRatio.displayName = "AspectRatio";

export default AspectRatio;
