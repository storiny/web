"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import { levelToClassNameMap, scaleToClassNameMap } from "../common/typography";
import typographyStyles from "../common/Typography.module.scss";
import styles from "./Link.module.scss";
import { LinkProps } from "./Link.props";

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const {
    ellipsis,
    level = "inherit",
    underline = "hover",
    color = "body",
    slot_props,
    fixedColor,
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
        ellipsis && typographyStyles.ellipsis,
        fixedColor && styles["fixed-color"],
        styles[`color-${color}`],
        styles[`underline-${underline}`],
        scale
          ? scaleToClassNameMap[scale]
          : level !== "inherit"
          ? levelToClassNameMap[level]
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
          {...slot_props?.ellipsisCell}
          className={clsx(
            "ellipsis",
            typographyStyles["ellipsis-child"],
            slot_props?.ellipsisCell?.className
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
