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

// TODO: add hover-cards for mention and tag

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
      slotProps,
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
            ellipsis && "ellipsis",
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
              {...slotProps?.link}
              className={clsx(styles.link, slotProps?.link?.className)}
              href={`${level === "tag" ? "/tag/" : "/"}${children}`}
            >
              {prefixMap[level] || ""}
              {children}
            </NextLink>
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
