"use client";

import { Action, Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "src/utils/forward-ref";

import common_styles from "../common/toast.module.scss";
import Divider from "../divider";
import styles from "./notification.module.scss";
import { NotificationProps } from "./notification.props";

const Notification = forward_ref<NotificationProps, "li">((props, ref) => {
  const {
    as: Component = "li",
    children,
    className,
    icon,
    slot_props,
    primary_button_text = "Confirm",
    secondary_button_text = "Dismiss",
    ...rest
  } = props;
  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.notification,
        common_styles["toast-animation"],
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
            altText={slot_props?.primary_button?.altText || primary_button_text}
            asChild
          >
            <button
              {...slot_props?.primary_button}
              className={clsx(
                "unset",
                "focusable",
                "focus-invert",
                "t-center",
                styles.button,
                slot_props?.secondary_button?.className
              )}
            >
              {primary_button_text}
            </button>
          </Action>
          <Divider aria-hidden className={"not-mobile"} />
          <Divider
            aria-hidden
            className={"only-mobile"}
            orientation={"vertical"}
          />
          <Close
            {...slot_props?.secondary_button}
            aria-label={secondary_button_text}
            className={clsx(
              "unset",
              "focusable",
              "t-center",
              styles.button,
              slot_props?.secondary_button?.className
            )}
          >
            {secondary_button_text}
          </Close>
        </div>
      </Component>
    </Root>
  );
});

Notification.displayName = "Notification";

export default Notification;
