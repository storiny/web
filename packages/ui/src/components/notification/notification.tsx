"use client";

import clsx from "clsx";
import { Toast } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

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
    <Toast.Root
      {...rest}
      asChild
      className={clsx(
        styles.notification,
        common_styles["toast-animation"],
        css["focusable"],
        className
      )}
      data-testid={"notification"}
      ref={ref}
    >
      <Component>
        <Toast.Description
          className={clsx(css["flex-center"], styles.description)}
        >
          {icon && (
            <span
              {...slot_props?.decorator}
              className={clsx(
                css["flex-center"],
                styles.decorator,
                slot_props?.decorator?.className
              )}
            >
              {icon}
            </span>
          )}
          {children}
        </Toast.Description>
        <Divider
          aria-hidden
          className={css["not-mobile"]}
          orientation={"vertical"}
        />
        <Divider aria-hidden className={css["only-mobile"]} />
        <div
          {...slot_props?.actions}
          className={clsx(styles.actions, slot_props?.actions?.className)}
        >
          <Toast.Action
            altText={slot_props?.primary_button?.altText || primary_button_text}
            asChild
          >
            <button
              {...slot_props?.primary_button}
              className={clsx(
                css["focusable"],
                css["focus-invert"],
                css["t-center"],
                styles.button,
                slot_props?.secondary_button?.className
              )}
            >
              {primary_button_text}
            </button>
          </Toast.Action>
          <Divider aria-hidden className={css["not-mobile"]} />
          <Divider
            aria-hidden
            className={css["only-mobile"]}
            orientation={"vertical"}
          />
          <Toast.Close
            {...slot_props?.secondary_button}
            aria-label={secondary_button_text}
            className={clsx(
              css["focusable"],
              css["t-center"],
              styles.button,
              slot_props?.secondary_button?.className
            )}
          >
            {secondary_button_text}
          </Toast.Close>
        </div>
      </Component>
    </Toast.Root>
  );
});

Notification.displayName = "Notification";

export default Notification;
