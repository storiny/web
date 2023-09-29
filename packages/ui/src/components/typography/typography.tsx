"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";
import { is_hex_color } from "src/utils/is-hex-color";

import {
  TYPOGRAPHY_LEVEL_TO_ELEMENT_MAP,
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP,
  TYPOGRAPHY_PREFIX_MAP,
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
} from "../common/typography";
import typography_styles from "../common/typography.module.scss";
import styles from "./typography.module.scss";
import {
  TypographyElement,
  TypographyLevel,
  TypographyProps
} from "./typography.props";
import { TypographyNestedContext } from "./typography-context";

// TODO: Add hover-cards for mention and tag types

const Typography = forward_ref<TypographyProps, TypographyElement>(
  (props, ref) => {
    const {
      as: Component,
      level = "body1",
      color = "major",
      scale,
      ellipsis,
      className,
      children,
      slot_props,
      ...rest
    } = props;
    const is_nested = React.useContext(TypographyNestedContext);
    const Element =
      Component ||
      ((is_nested && !["inline-code", "blockquote"].includes(level)
        ? "span"
        : TYPOGRAPHY_LEVEL_TO_ELEMENT_MAP[level]) as React.ElementType);
    const is_inline_color =
      level === "inline-code" && is_hex_color(String(children));

    return (
      <TypographyNestedContext.Provider value>
        <Element
          {...rest}
          className={clsx(
            level === "inline-code" && "t-mono",
            ellipsis && typography_styles.ellipsis,
            is_inline_color && styles["inline-color"],
            level === "legible" || color === "legible"
              ? "t-legible-fg"
              : `t-${color}`,
            scale
              ? TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP[scale]
              : TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[level],
            styles[level],
            className
          )}
          ref={ref}
          {...(is_inline_color
            ? {
                style: {
                  ...rest?.style,
                  "--color": children
                }
              }
            : {})}
        >
          {(["mention", "tag"] as TypographyLevel[]).includes(level) ? (
            <NextLink
              {...slot_props?.link}
              className={clsx(
                styles.link,
                ellipsis && "ellipsis",
                ellipsis && typography_styles["ellipsis-child"],
                slot_props?.link?.className
              )}
              href={`${level === "tag" ? "/tag/" : "/"}${children}`}
            >
              {TYPOGRAPHY_PREFIX_MAP[level] || ""}
              {children}
            </NextLink>
          ) : ellipsis ? (
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
        </Element>
      </TypographyNestedContext.Provider>
    );
  }
);

Typography.displayName = "Typography";

export default Typography;
