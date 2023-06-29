"use client";

import { Indicator, Root } from "@radix-ui/react-progress";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Spinner.module.scss";
import { SpinnerProps } from "./Spinner.props";

const Spinner = forwardRef<SpinnerProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    value,
    size = "md",
    color = "inverted",
    className,
    slotProps,
    style,
    children,
    ...rest
  } = props;

  return (
    <Root
      {...rest}
      asChild
      className={clsx(styles.spinner, styles[size], styles[color], className)}
      ref={ref}
      style={{ "--value": value, ...style } as React.CSSProperties}
      value={value}
    >
      <Component>
        <Indicator
          {...slotProps?.indicator}
          className={clsx(styles.indicator, slotProps?.indicator?.className)}
        >
          <svg
            aria-hidden
            {...slotProps?.svg}
            className={clsx(styles.svg, slotProps?.svg?.className)}
          >
            <circle
              {...slotProps?.track}
              className={clsx(styles.track, slotProps?.track?.className)}
              cx={"50%"}
              cy={"50%"}
            />
            <circle
              {...slotProps?.progress}
              className={clsx(styles.progress, slotProps?.progress?.className)}
              cx={"50%"}
              cy={"50%"}
            />
          </svg>
        </Indicator>
        {children}
      </Component>
    </Root>
  );
});

Spinner.displayName = "Spinner";

export default Spinner;
