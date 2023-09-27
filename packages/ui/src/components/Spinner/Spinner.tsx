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
    slot_props,
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
              className={clsx(styles.progress, slot_props?.progress?.className)}
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
