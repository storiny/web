"use client";

import clsx from "clsx";
import { Progress } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./progress-bar.module.scss";
import { ProgressBarProps } from "./progress-bar.props";

const ProgressBar = forward_ref<ProgressBarProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    value,
    size = "md",
    className,
    slot_props,
    ...rest
  } = props;

  return (
    <Progress.Root
      {...rest}
      asChild
      className={clsx(styles["progress-bar"], styles[size], className)}
      ref={ref}
      value={value}
    >
      <Component>
        <Progress.Indicator
          {...slot_props?.indicator}
          className={clsx(styles.indicator, slot_props?.indicator?.className)}
          style={{
            ...slot_props?.indicator?.style,
            transform: `translateX(-${100 - value}%)`
          }}
        />
      </Component>
    </Progress.Root>
  );
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
