"use client";

import clsx from "clsx";
import { Progress } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./spinner.module.scss";
import { SpinnerProps } from "./spinner.props";

const Spinner = forward_ref<SpinnerProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    color = "inverted",
    className,
    slot_props,
    ...rest
  } = props;

  return (
    <Progress.Root
      {...rest}
      asChild
      className={clsx(styles.spinner, styles[size], styles[color], className)}
      ref={ref}
      value={null}
    >
      <Component>
        <Progress.Indicator
          {...slot_props?.indicator}
          className={clsx(styles.indicator, slot_props?.indicator?.className)}
        >
          {[...new Array(12)].map((_, index) => (
            <span
              {...slot_props?.bar}
              className={clsx(styles.bar, slot_props?.bar?.className)}
              key={index}
            />
          ))}
        </Progress.Indicator>
      </Component>
    </Progress.Root>
  );
});

Spinner.displayName = "Spinner";

export default Spinner;
