"use client";

import { Close, Description, Root } from "@radix-ui/react-toast";
import clsx from "clsx";
import React from "react";

import AlertSquareIcon from "~/icons/AlertSquare";
import CheckSquareIcon from "~/icons/CheckSquare";
import InfoIcon from "~/icons/Info";
import XIcon from "~/icons/X";
import XSquareIcon from "~/icons/XSquare";
import { forward_ref } from "src/utils/forward-ref";

import common_styles from "../common/toast.module.scss";
import styles from "./toast.module.scss";
import { ToastProps, ToastSeverity } from "./toast.props";

const SEVERITY_ICON_MAP: Record<ToastSeverity, React.ReactNode> = {
  blank: null,
  error: <XSquareIcon />,
  info: <InfoIcon />,
  success: <CheckSquareIcon />,
  warning: <AlertSquareIcon />
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
        "focusable",
        className
      )}
      data-testid={"toast"}
      ref={ref}
    >
      <Component>
        <Description className={clsx("ellipsis", styles.description)}>
          {severity !== "blank" && (
            <span
              {...slot_props?.decorator}
              className={clsx(
                styles.decorator,
                styles[severity],
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
          className={clsx("unset", styles.close, slot_props?.close?.className)}
        >
          <span
            aria-hidden
            className={clsx("flex-center", styles["close-wrapper"])}
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
