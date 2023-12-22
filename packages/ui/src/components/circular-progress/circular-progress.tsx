"use client";

import { Indicator, Root } from "@radix-ui/react-progress";
import clsx from "clsx";
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
      <Root
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
          <Indicator
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
          </Indicator>
          {children}
        </Component>
      </Root>
    );
  }
);

CircularProgress.displayName = "CircularProgress";

export default CircularProgress;
