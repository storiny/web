"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./badge.module.scss";
import { BadgeOrigin, BadgeProps } from "./badge.props";

/**
 * Returns badge translation props
 * @param anchor_origin Anchor origin
 */
export const get_translation_props = (
  anchor_origin: BadgeOrigin
): {
  transform_origin_x: string;
  transform_origin_y: string;
  translate_x: string;
  translate_y: string;
} => ({
  translate_y:
    anchor_origin?.vertical === "top" ? "translateY(-50%)" : "translateY(50%)",
  translate_x:
    anchor_origin?.horizontal === "left"
      ? "translateX(-50%)"
      : "translateX(50%)",
  transform_origin_y: anchor_origin?.vertical === "top" ? "0%" : "100%",
  transform_origin_x: anchor_origin?.horizontal === "left" ? "0%" : "100%"
});

/**
 * Returns badge inset position
 * @param badge_inset Badge inset
 */
export const get_inset_position = (
  badge_inset: BadgeProps["inset"]
): {
  bottom: string | number | undefined;
  left: string | number | undefined;
  right: string | number | undefined;
  top: string | number | undefined;
} => {
  const inset = {
    top: badge_inset,
    left: badge_inset,
    bottom: badge_inset,
    right: badge_inset
  };

  if (typeof badge_inset === "string") {
    const inset_values = badge_inset.split(" ");

    if (inset_values.length > 1) {
      inset.top = inset_values[0];
      inset.right = inset_values[1];

      if (inset_values.length === 2) {
        inset.bottom = inset_values[0];
        inset.left = inset_values[1];
      }

      if (inset_values.length === 3) {
        inset.left = inset_values[1];
        inset.bottom = inset_values[2];
      }

      if (inset_values.length === 4) {
        inset.bottom = inset_values[2];
        inset.left = inset_values[3];
      }
    }
  }

  return inset;
};

const Badge = forward_ref<BadgeProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    color = "inverted",
    size = "md",
    elevation = "body",
    inset: badge_inset = "14%",
    visible = true,
    anchor_origin = { vertical: "bottom", horizontal: "right" },
    badge_content,
    children,
    className,
    style,
    slot_props,
    ...rest
  } = props;
  const inset = get_inset_position(badge_inset);
  const { transform_origin_x, transform_origin_y, translate_y, translate_x } =
    get_translation_props(anchor_origin);

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
            [anchor_origin.vertical]: inset[anchor_origin.vertical],
            [anchor_origin.horizontal]: inset[anchor_origin.horizontal],
            transform: `scale(${
              visible ? 1 : 0
            }) ${translate_x} ${translate_y}`,
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            transformOrigin: `${transform_origin_x} ${transform_origin_y}`,
            ...style
          } as React.CSSProperties
        }
      >
        {badge_content}
      </Component>
    </div>
  );
});

Badge.displayName = "Badge";

export default Badge;
