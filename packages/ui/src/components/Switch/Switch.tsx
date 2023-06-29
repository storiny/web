"use client";

import { Root, Thumb } from "@radix-ui/react-switch";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Switch.module.scss";
import { SwitchProps } from "./Switch.props";

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

const Switch = forwardRef<SwitchProps, "button">((props, ref) => {
  const {
    as: Component = "button",
    color = "inverted",
    size = "md",
    className,
    slotProps,
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
          {...slotProps?.thumb}
          className={clsx(
            "flex-center",
            styles.thumb,
            slotProps?.thumb?.className
          )}
        >
          <BarIndicator {...slotProps?.barIndicator} />
          <span />
          <RingIndicator {...slotProps?.ringIndicator} />
        </Thumb>
      </Component>
    </Root>
  );
});

Switch.displayName = "Switch";

export default Switch;
