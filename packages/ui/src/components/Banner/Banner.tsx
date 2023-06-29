"use client";

import { Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import AlertSquareIcon from "~/icons/AlertSquare";
import InfoIcon from "~/icons/Info";
import XIcon from "~/icons/X";
import XSquareIcon from "~/icons/XSquare";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Banner.module.scss";
import { BannerIcon, BannerProps } from "./Banner.props";

const iconMap: Record<BannerIcon, React.ReactNode> = {
  error: <XSquareIcon />,
  info: <InfoIcon />,
  warning: <AlertSquareIcon />,
};

const Banner = forwardRef<BannerProps, "li">((props, ref) => {
  const {
    as: Component = "li",
    children,
    className,
    icon,
    color = "inverted",
    slotProps,
    ...rest
  } = props;

  return (
    <Root
      {...rest}
      asChild
      className={clsx(styles.banner, styles[color], "focusable", className)}
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
              {...slotProps?.decorator}
              className={clsx(
                "flex-center",
                styles.decorator,
                slotProps?.decorator?.className
              )}
            >
              {iconMap[icon]}
            </span>
          )}
          {children}
        </Description>
        <Close
          aria-label="Dismiss"
          title={"Dismiss"}
          {...slotProps?.close}
          className={clsx(
            "unset",
            "focusable",
            styles.close,
            slotProps?.close?.className
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
