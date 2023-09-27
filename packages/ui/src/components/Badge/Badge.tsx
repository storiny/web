"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Badge.module.scss";
import { BadgeOrigin, BadgeProps } from "./Badge.props";

/**
 * Returns badge translation props
 * @param anchorOrigin Anchor origin
 */
export const getTranslationProps = (
  anchorOrigin: BadgeOrigin
): {
  transformOriginX: string;
  transformOriginY: string;
  translateX: string;
  translateY: string;
} => ({
  translateY:
    anchorOrigin?.vertical === "top" ? "translateY(-50%)" : "translateY(50%)",
  translateX:
    anchorOrigin?.horizontal === "left"
      ? "translateX(-50%)"
      : "translateX(50%)",
  transformOriginY: anchorOrigin?.vertical === "top" ? "0%" : "100%",
  transformOriginX: anchorOrigin?.horizontal === "left" ? "0%" : "100%"
});

/**
 * Returns badge inset position
 * @param badgeInset Badge inset
 */
export const getInsetPosition = (
  badgeInset: BadgeProps["inset"]
): {
  bottom: string | number | undefined;
  left: string | number | undefined;
  right: string | number | undefined;
  top: string | number | undefined;
} => {
  const inset = {
    top: badgeInset,
    left: badgeInset,
    bottom: badgeInset,
    right: badgeInset
  };

  if (typeof (badgeInset as string) === "string") {
    const insetValues = (badgeInset as string).split(" ");

    if (insetValues.length > 1) {
      inset.top = insetValues[0];
      inset.right = insetValues[1];

      if (insetValues.length === 2) {
        inset.bottom = insetValues[0];
        inset.left = insetValues[1];
      }

      if (insetValues.length === 3) {
        inset.left = insetValues[1];
        inset.bottom = insetValues[2];
      }

      if (insetValues.length === 4) {
        inset.bottom = insetValues[2];
        inset.left = insetValues[3];
      }
    }
  }

  return inset;
};

const Badge = forwardRef<BadgeProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    color = "inverted",
    size = "md",
    elevation = "body",
    inset: badgeInset = "14%",
    visible = true,
    anchorOrigin = { vertical: "bottom", horizontal: "right" },
    badgeContent,
    children,
    className,
    style,
    slot_props,
    ...rest
  } = props;
  const inset = getInsetPosition(badgeInset);
  const { transformOriginX, transformOriginY, translateY, translateX } =
    getTranslationProps(anchorOrigin);

  return (
    <div
      {...slot_props?.container}
      className={clsx(styles.container, slot_props?.container?.className)}
    >
      {children}
      <Component
        {...rest}
        className={clsx(
          "flex-center",
          styles.badge,
          styles[color],
          styles[size],
          className
        )}
        ref={ref}
        style={
          {
            "--ring-bg": `var(--bg-${
              elevation === "body" ? "body" : `elevation-${elevation}`
            })`,
            [anchorOrigin.vertical]: inset[anchorOrigin.vertical],
            [anchorOrigin.horizontal]: inset[anchorOrigin.horizontal],
            transform: `scale(${visible ? 1 : 0}) ${translateX} ${translateY}`,
            transformOrigin: `${transformOriginX} ${transformOriginY}`,
            ...style
          } as React.CSSProperties
        }
      >
        {badgeContent}
      </Component>
    </div>
  );
});

Badge.displayName = "Badge";

export default Badge;
