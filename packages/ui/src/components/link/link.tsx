"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import {
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP,
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
} from "../common/typography";
import typography_styles from "../common/typography.module.scss";
import styles from "./link.module.scss";
import { LinkProps } from "./link.props";

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const {
    ellipsis,
    level = "inherit",
    underline = "hover",
    color = "body",
    slot_props,
    fixed_color,
    target,
    rel,
    disabled,
    scale,
    className,
    children,
    href,
    ...rest
  } = props;

  return (
    <NextLink
      {...rest}
      className={clsx(
        "focusable",
        styles.link,
        ellipsis && typography_styles.ellipsis,
        fixed_color && styles["fixed-color"],
        styles[`color-${color}`],
        styles[`underline-${underline}`],
        scale
          ? TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP[scale]
          : level !== "inherit"
          ? TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[level]
          : styles.inherit,
        disabled && styles.disabled,
        className
      )}
      href={href}
      ref={ref}
      rel={
        rel ||
        (!href.startsWith("/") || target === "_blank" ? "noreferrer" : "")
      }
      target={target}
    >
      {ellipsis ? (
        <span
          {...slot_props?.ellipsis_cell}
          className={clsx(
            "ellipsis",
            typography_styles["ellipsis-child"],
            slot_props?.ellipsis_cell?.className
          )}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </NextLink>
  );
});

Link.displayName = "Link";

export default Link;
