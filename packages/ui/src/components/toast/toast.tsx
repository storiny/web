"use client";

import { Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import CheckIcon from "~/icons/check";
import ExclamationIcon from "~/icons/exclamation";
import InfoIcon from "~/icons/info";
import XIcon from "~/icons/x";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import common_styles from "../common/toast.module.scss";
import styles from "./toast.module.scss";
import { ToastProps, ToastSeverity } from "./toast.props";

const SEVERITY_ICON_MAP: Record<ToastSeverity, React.ReactNode> = {
  blank: null,
  error: <XIcon />,
  info: <InfoIcon />,
  success: <CheckIcon />,
  warning: <ExclamationIcon />
};

const Toast = forward_ref<ToastProps, "li">((props, ref) => {
  const {
    as: Component = "li",
    children,
    className,
    severity = "blank",
    slot_props,
    ...rest
  } = props;
  return (
    <Root
      {...rest}
      asChild
      className={clsx(
        styles.toast,
        common_styles["toast-animation"],
        css["focusable"],
        className
      )}
      data-testid={"toast"}
      ref={ref}
    >
      <Component>
        <Description className={clsx(css["ellipsis"], styles.description)}>
          {severity !== "blank" && (
            <span
              {...slot_props?.decorator}
              className={clsx(
                styles.decorator,
                slot_props?.decorator?.className
              )}
            >
              {SEVERITY_ICON_MAP[severity]}
            </span>
          )}
          {children}
        </Description>
        <Close
          aria-label="Dismiss"
          title={"Dismiss"}
          {...slot_props?.close}
          className={clsx(styles.close, slot_props?.close?.className)}
        >
          <span
            aria-hidden
            className={clsx(css["flex-center"], styles["close-wrapper"])}
          >
            <XIcon />
          </span>
        </Close>
      </Component>
    </Root>
  );
});

Toast.displayName = "Toast";

export default Toast;
