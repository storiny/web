"use client";

import { Indicator, Root } from "@radix-ui/react-progress";
import clsx from "clsx";
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
    <Root
      {...rest}
      asChild
      className={clsx(styles["progress-bar"], styles[size], className)}
      ref={ref}
      value={value}
    >
      <Component>
        <Indicator
          {...slot_props?.indicator}
          className={clsx(styles.indicator, slot_props?.indicator?.className)}
          style={{
            ...slot_props?.indicator?.style,
            transform: `translateX(-${100 - value}%)`
          }}
        />
      </Component>
    </Root>
  );
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
