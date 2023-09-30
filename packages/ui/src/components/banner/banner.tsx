"use client";

import { Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import XIcon from "~/icons/x";
import { forward_ref } from "~/utils/forward-ref";

import styles from "./banner.module.scss";
import { BannerProps } from "./banner.props";

const Banner = forward_ref<BannerProps, "li">((props, ref) => {
  const {
    as: Component = "li",
    children,
    className,
    icon,
    color = "inverted",
    slot_props,
    ...rest
  } = props;
  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        "focusable",
        "focus-invert",
        styles.banner,
        styles[color],
        className
      )}
      data-testid={"banner"}
      // Disable closing on escape
      onEscapeKeyDown={(event): void => event.preventDefault()}
      // Prevent swipe gestures
      onSwipeEnd={(event): void => event.preventDefault()}
      onSwipeMove={(event): void => event.preventDefault()}
      onSwipeStart={(event): void => event.preventDefault()}
      ref={ref}
    >
      <Component>
        <Description className={clsx("flex", "t-center", styles.description)}>
          {icon && (
            <span
              {...slot_props?.decorator}
              className={clsx(
                "flex-center",
                styles.decorator,
                slot_props?.decorator?.className
              )}
            >
              {icon}
            </span>
          )}
          {children}
        </Description>
        <Close
          aria-label="Dismiss"
          title={"Dismiss"}
          {...slot_props?.close}
          className={clsx(
            "unset",
            "focusable",
            styles.close,
            slot_props?.close?.className
          )}
        >
          <XIcon />
        </Close>
      </Component>
    </Root>
  );
});

Banner.displayName = "Banner";

export default Banner;
