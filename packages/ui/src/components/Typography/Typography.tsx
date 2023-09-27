"use client";

import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";
import { isHexColor } from "~/utils/isHexColor";

import {
  defaultLevelToNativeElementMap,
  levelToClassNameMap,
  prefixMap,
  scaleToClassNameMap
} from "../common/typography";
import typographyStyles from "../common/Typography.module.scss";
import styles from "./Typography.module.scss";
import {
  TypographyElement,
  TypographyLevel,
  TypographyProps
} from "./Typography.props";
import { TypographyNestedContext } from "./TypographyContext";

// TODO: Add hover-cards for mention and tag

const Typography = forwardRef<TypographyProps, TypographyElement>(
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
    const isNested = React.useContext(TypographyNestedContext);
    const Element =
      Component ||
      ((isNested && !["inline-code", "blockquote"].includes(level)
        ? "span"
        : defaultLevelToNativeElementMap[level]) as React.ElementType);
    const isInlineColor =
      level === "inline-code" && isHexColor(String(children));

    return (
      <TypographyNestedContext.Provider value>
        <Element
          {...rest}
          className={clsx(
            level === "inline-code" && "t-mono",
            ellipsis && typographyStyles.ellipsis,
            isInlineColor && styles["inline-color"],
            level === "legible" || color === "legible"
              ? "t-legible-fg"
              : `t-${color}`,
            scale ? scaleToClassNameMap[scale] : levelToClassNameMap[level],
            styles[level],
            className
          )}
          ref={ref}
          {...(isInlineColor
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
                ellipsis && typographyStyles["ellipsis-child"],
                slot_props?.link?.className
              )}
              href={`${level === "tag" ? "/tag/" : "/"}${children}`}
            >
              {prefixMap[level] || ""}
              {children}
            </NextLink>
          ) : ellipsis ? (
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
        </Element>
      </TypographyNestedContext.Provider>
    );
  }
);

Typography.displayName = "Typography";

export default Typography;
