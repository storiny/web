"use client";

import clsx from "clsx";
import { Switch as SwitchPrimitive } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

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
    <SwitchPrimitive.Root
      {...rest}
      asChild
      className={clsx(
        css["focusable"],
        styles.switch,
        styles[color],
        styles[size],
        className
      )}
      ref={ref}
    >
      <Component>
        <SwitchPrimitive.Thumb
          {...slot_props?.thumb}
          className={clsx(
            css["flex-center"],
            styles.thumb,
            slot_props?.thumb?.className
          )}
        >
          <BarIndicator {...slot_props?.bar_indicator} />
          <span />
          <RingIndicator {...slot_props?.ring_indicator} />
        </SwitchPrimitive.Thumb>
      </Component>
    </SwitchPrimitive.Root>
  );
});

Switch.displayName = "Switch";

export default Switch;
