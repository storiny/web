"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import UserHoverCard from "~/components/user-hover-card";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";
import { is_hex_color } from "~/utils/is-hex-color";

import {
  TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP,
  TYPOGRAPHY_LEVEL_TO_ELEMENT_MAP,
  TYPOGRAPHY_PREFIX_MAP,
  TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP
} from "../common/typography";
import typography_styles from "../common/typography.module.scss";
import styles from "./typography.module.scss";
import { TypographyElement, TypographyProps } from "./typography.props";
import { TypographyNestedContext } from "./typography-context";

const Typography = forward_ref<TypographyProps, TypographyElement>(
  (props, ref) => {
    const {
      as: Component,
      level = "body1",
      color = "major",
      scale,
      ellipsis,
      disable_hovercards,
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
            level === "inline-code" && css["t-mono"],
            ellipsis && typography_styles.ellipsis,
            is_inline_color && styles["inline-color"],
            css[
              level === "legible" || color === "legible"
                ? "t-legible-fg"
                : `t-${color}`
            ],
            scale
              ? TYPOGRAPHY_SCALE_TO_CLASSNAME_MAP[scale]
              : TYPOGRAPHY_LEVEL_TO_CLASSNAME_MAP[level],
            styles[level],
            ["tag", "mention"].includes(level) && styles.inline,
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
          {level === "tag" ? (
            <NextLink
              {...slot_props?.link}
              className={clsx(
                styles.link,
                ellipsis && css["ellipsis"],
                ellipsis && typography_styles["ellipsis-child"],
                slot_props?.link?.className
              )}
              href={`/tag/${String(children).replace(/#/g, "")}`}
            >
              {TYPOGRAPHY_PREFIX_MAP[level] || ""}
              {String(children).replace(/#/g, "")}
            </NextLink>
          ) : level === "mention" ? (
            <UserHoverCard
              identifier={String(children).replace(/@/g, "")}
              open={disable_hovercards ? false : undefined}
            >
              <NextLink
                {...slot_props?.link}
                className={clsx(
                  styles.link,
                  ellipsis && css["ellipsis"],
                  ellipsis && typography_styles["ellipsis-child"],
                  slot_props?.link?.className
                )}
                href={`/${String(children).replace(/@/g, "")}`}
              >
                {TYPOGRAPHY_PREFIX_MAP[level] || ""}
                {String(children).replace(/@/g, "")}
              </NextLink>
            </UserHoverCard>
          ) : ellipsis ? (
            <span
              {...slot_props?.ellipsis_cell}
              className={clsx(
                css["ellipsis"],
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
