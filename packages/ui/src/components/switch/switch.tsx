"use client";

import { Root, Thumb } from "@radix-ui/react-switch";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";

import styles from "./switch.module.scss";
import { SwitchProps } from "./switch.props";

const RingIndicator = ({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"svg">): React.ReactElement => (
  <svg
    {...rest}
    aria-hidden
    className={clsx(styles.indicator, className)}
    viewBox="0 0 14 14"
  >
    <path d="M12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0ZM3 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" />
  </svg>
);

const BarIndicator = ({
  className,
  ...rest
}: React.ComponentPropsWithoutRef<"svg">): React.ReactElement => (
  <svg
    {...rest}
    aria-hidden
    className={clsx(styles.indicator, className)}
    viewBox="0 0 14 14"
  >
    <path d="M6.5 2h1v10h-1z" />
  </svg>
);

const Switch = forward_ref<SwitchProps, "button">((props, ref) => {
  const {
    as: Component = "button",
    color = "inverted",
    size = "md",
    className,
    slot_props,
    ...rest
  } = props;
  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        "unset",
        "focusable",
        styles.switch,
        styles[color],
        styles[size],
        className
      )}
      ref={ref}
    >
      <Component>
        <Thumb
          {...slot_props?.thumb}
          className={clsx(
            "flex-center",
            styles.thumb,
            slot_props?.thumb?.className
          )}
        >
          <BarIndicator {...slot_props?.bar_indicator} />
          <span />
          <RingIndicator {...slot_props?.ring_indicator} />
        </Thumb>
      </Component>
    </Root>
  );
});

Switch.displayName = "Switch";

export default Switch;
