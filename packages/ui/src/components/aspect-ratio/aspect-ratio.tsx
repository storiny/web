"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./aspect-ratio.module.scss";
import { AspectRatioProps } from "./aspect-ratio.props";

const AspectRatio = forward_ref<AspectRatioProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    ratio = 1,
    children,
    object_fit = "cover",
    className,
    slot_props,
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
          "--object-fit": object_fit,
          "--padding": `${(100 / ratio).toFixed(3)}%`
        } as React.CSSProperties
      }
    >
      <div
        {...slot_props?.wrapper}
        className={clsx(styles.wrapper, slot_props?.wrapper?.className)}
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
