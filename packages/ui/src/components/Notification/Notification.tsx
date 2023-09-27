"use client";

import { Action, Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import commonStyles from "../common/Toast.module.scss";
import Divider from "../Divider";
import styles from "./Notification.module.scss";
import { NotificationProps } from "./Notification.props";

const Notification = forwardRef<NotificationProps, "li">((props, ref) => {
  const {
    as: Component = "li",
    children,
    className,
    icon,
    slot_props,
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
        <Divider
          aria-hidden
          className={"not-mobile"}
          orientation={"vertical"}
        />
        <Divider aria-hidden className={"only-mobile"} />
        <div
          {...slot_props?.actions}
          className={clsx(styles.actions, slot_props?.actions?.className)}
        >
          <Action
            altText={slot_props?.primaryButton?.altText || primaryButtonText}
            asChild
          >
            <button
              {...slot_props?.primaryButton}
              className={clsx(
                "unset",
                "focusable",
                "focus-invert",
                "t-center",
                styles.button,
                slot_props?.secondaryButton?.className
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
            {...slot_props?.secondaryButton}
            aria-label={secondaryButtonText}
            className={clsx(
              "unset",
              "focusable",
              "t-center",
              styles.button,
              slot_props?.secondaryButton?.className
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
