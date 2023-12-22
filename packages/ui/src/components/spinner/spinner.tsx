"use client";

import { Indicator, Root } from "@radix-ui/react-progress";
import clsx from "clsx";
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
    <Root
      {...rest}
      asChild
      className={clsx(styles.spinner, styles[size], styles[color], className)}
      ref={ref}
      value={null}
    >
      <Component>
        <Indicator
          {...slot_props?.indicator}
          className={clsx(styles.indicator, slot_props?.indicator?.className)}
        >
          {[...new Array(12)].map((_, index) => (
            <span
              className={clsx(styles.bar, slot_props?.bar?.className)}
              key={index}
            />
          ))}
        </Indicator>
      </Component>
    </Root>
  );
});

Spinner.displayName = "Spinner";

export default Spinner;
