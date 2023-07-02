"use client";

import { Action, Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import AlertSquareIcon from "~/icons/AlertSquare";
import InfoIcon from "~/icons/Info";
import TypographyIcon from "~/icons/Typography";
import { forwardRef } from "~/utils/forwardRef";

import commonStyles from "../common/Toast.module.scss";
import Divider from "../Divider";
import styles from "./Notification.module.scss";
import { NotificationIcon, NotificationProps } from "./Notification.props";

const iconMap: Record<NotificationIcon, React.ReactNode> = {
  exclamation: <AlertSquareIcon />,
  info: <InfoIcon />,
  typography: <TypographyIcon />
};

const Notification = forwardRef<NotificationProps, "li">((props, ref) => {
  const {
    as: Component = "li",
    children,
    className,
    icon,
    slotProps,
    primaryButtonText = "Confirm",
    secondaryButtonText = "Dismiss",
    ...rest
  } = props;

  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.notification,
        commonStyles["toast-animation"],
        "focusable",
        className
      )}
      data-testid={"notification"}
      ref={ref}
    >
      <Component>
        <Description className={clsx("flex-center", styles.description)}>
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
        <Divider
          aria-hidden
          className={"not-mobile"}
          orientation={"vertical"}
        />
        <Divider aria-hidden className={"only-mobile"} />
        <div
          {...slotProps?.actions}
          className={clsx(styles.actions, slotProps?.actions?.className)}
        >
          <Action
            altText={slotProps?.primaryButton?.altText || primaryButtonText}
            asChild
          >
            <button
              {...slotProps?.primaryButton}
              className={clsx(
                "unset",
                "focusable",
                "t-center",
                styles.button,
                slotProps?.secondaryButton?.className
              )}
            >
              {primaryButtonText}
            </button>
          </Action>
          <Divider aria-hidden className={"not-mobile"} />
          <Divider
            aria-hidden
            className={"only-mobile"}
            orientation={"vertical"}
          />
          <Close
            {...slotProps?.secondaryButton}
            aria-label={secondaryButtonText}
            className={clsx(
              "unset",
              "focusable",
              "t-center",
              styles.button,
              slotProps?.secondaryButton?.className
            )}
          >
            {secondaryButtonText}
          </Close>
        </div>
      </Component>
    </Root>
  );
});

Notification.displayName = "Notification";

export default Notification;
