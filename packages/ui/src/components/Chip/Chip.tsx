"use client";

import clsx from "clsx";
import React from "react";

import XIcon from "~/icons/X";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Chip.module.scss";
import { ChipProps } from "./Chip.props";

const Chip = forwardRef<ChipProps, "span" | "button">((props, ref) => {
  const {
    type = "static",
    as: Component = type === "clickable" ? "button" : "span",
    className,
    children,
    size = "md",
    variant = "rigid",
    decorator,
    disabled,
    slotProps,
    ...rest
  } = props;

  return (
    <Component
      {...(type === "clickable" && {
        [Component === "button" ? "type" : "role"]: "button",
        "aria-disabled": String(Boolean(disabled)),
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
          {...slotProps?.decorator}
          className={clsx(styles.decorator, slotProps?.decorator?.className)}
        >
          {decorator}
        </span>
      )}
      {children}
      {type === "deletable" && (
        <button
          aria-label={"Delete"}
          type={"button"}
          {...slotProps?.action}
          className={clsx(
            styles.reset,
            styles.action,
            slotProps?.action?.className
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
