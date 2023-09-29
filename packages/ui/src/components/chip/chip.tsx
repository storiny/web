"use client";

import clsx from "clsx";
import React from "react";

import XIcon from "src/icons/x";
import { forward_ref } from "src/utils/forward-ref";

import styles from "./chip.module.scss";
import { ChipProps } from "./chip.props";

const Chip = forward_ref<ChipProps, "span" | "button">((props, ref) => {
  const {
    type = "static",
    as: Component = type === "clickable" ? "button" : "span",
    className,
    children,
    size = "md",
    variant = "rigid",
    decorator,
    disabled,
    slot_props,
    ...rest
  } = props;

  return (
    <Component
      {...(type === "clickable" && {
        [Component === "button" ? "type" : "role"]: "button",
        "aria-disabled": String(Boolean(disabled))
      })}
      {...rest}
      className={clsx(
        styles.reset,
        size === "md" ? "t-body-3" : "t-body-2",
        "focusable",
        styles.chip,
        styles[size],
        styles[type],
        styles[variant],
        disabled && styles.disabled,
        className
      )}
      data-disabled={String(Boolean(disabled))}
      ref={ref}
    >
      {decorator && (
        <span
          {...slot_props?.decorator}
          className={clsx(styles.decorator, slot_props?.decorator?.className)}
        >
          {decorator}
        </span>
      )}
      {children}
      {type === "deletable" && (
        <button
          aria-label={"Delete"}
          type={"button"}
          {...slot_props?.action}
          className={clsx(
            styles.reset,
            styles.action,
            slot_props?.action?.className
          )}
        >
          <XIcon />
        </button>
      )}
    </Component>
  );
});

Chip.displayName = "Chip";

export default Chip;
