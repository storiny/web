"use client";

import clsx from "clsx";
import { Progress } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./circular-progress.module.scss";
import { CircularProgressProps } from "./circular-progress.props";

const CircularProgress = forward_ref<CircularProgressProps, "div">(
  (props, ref) => {
    const {
      as: Component = "div",
      value,
      size = "md",
      color = "inverted",
      className,
      slot_props,
      style,
      children,
      ...rest
    } = props;

    return (
      <Progress.Root
        {...rest}
        asChild
        className={clsx(
          styles["circular-progress"],
          styles[size],
          styles[color],
          className
        )}
        ref={ref}
        style={{ "--value": value ?? "", ...style } as React.CSSProperties}
        value={value}
      >
        <Component>
          <Progress.Indicator
            {...slot_props?.indicator}
            className={clsx(styles.indicator, slot_props?.indicator?.className)}
          >
            <svg
              aria-hidden
              {...slot_props?.svg}
              className={clsx(styles.svg, slot_props?.svg?.className)}
            >
              <circle
                {...slot_props?.track}
                className={clsx(styles.track, slot_props?.track?.className)}
                cx={"50%"}
                cy={"50%"}
              />
              <circle
                {...slot_props?.progress}
                className={clsx(
                  styles.progress,
                  slot_props?.progress?.className
                )}
                cx={"50%"}
                cy={"50%"}
              />
            </svg>
          </Progress.Indicator>
          {children}
        </Component>
      </Progress.Root>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

export default CircularProgress;
