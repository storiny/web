"use client";

import { VIBRATION_PATTERNS } from "@storiny/shared";
import { devConsole } from "@storiny/shared/src/utils/devLog";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import clsx from "clsx";
import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";
import { selectHapticFeedback } from "~/redux/features";
import { selectLoggedIn } from "~/redux/features/auth/selectors";
import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { forwardRef } from "~/utils/forwardRef";

import buttonStyles from "../common/ButtonReset.module.scss";
import Spinner from "../Spinner";
import styles from "./Button.module.scss";
import { ButtonProps } from "./Button.props";

const Button = forwardRef<ButtonProps, "button">((props, ref) => {
  const {
    as = "button",
    autoSize,
    children,
    className,
    loading,
    disabled: disabledProp,
    color = "inverted",
    size: sizeProp = "md",
    variant = "rigid",
    type = "button",
    decorator,
    checkAuth,
    onClick,
    slotProps,
    ...rest
  } = props;
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const buttonRef = React.useRef<HTMLElement>(null);
  const disabled = Boolean(disabledProp || loading);
  const loggedIn = useAppSelector(selectLoggedIn);
  const haptic_feedback = useAppSelector(selectHapticFeedback);
  const shouldLogin = checkAuth && !loggedIn;
  const Component = shouldLogin ? "a" : as;
  const size = autoSize ? (isSmallerThanTablet ? "lg" : sizeProp) : sizeProp;
  const to = (rest as any)?.href
    ? `?to=${encodeURIComponent((rest as any).href)}`
    : "";

  /**
   * Handles click event
   * @param event Click event
   */
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (shouldLogin) {
      if (isTestEnv()) {
        event.preventDefault(); // Prevent navigation when testing
      }
    } else {
      onClick?.(event);
    }

    try {
      if ("vibrate" in navigator && haptic_feedback) {
        navigator.vibrate(VIBRATION_PATTERNS.click);
      }
    } catch (e) {
      devConsole.error(e);
    }
  };

  React.useImperativeHandle(ref, () => buttonRef.current!);

  return (
    <Component
      {...rest}
      aria-disabled={String(disabled)}
      className={clsx(
        buttonStyles.reset,
        "focusable",
        `variant-${variant}`,
        `color-${color}`,
        styles.button,
        loading && [styles.loading, "loading"],
        disabled && [styles.disabled, "disabled"],
        styles[size],
        className
      )}
      onClick={handleClick}
      ref={buttonRef}
      tabIndex={disabled ? -1 : 0}
      {...(shouldLogin
        ? {
            href: `/login${to}`
          }
        : {})}
      {...(Component === "button"
        ? { type, disabled }
        : {
            role: "button",
            // Trigger button click when space-bar is pressed
            onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>): void => {
              // Space-bar key
              if (event.key === " " && !disabled) {
                // Prevent page scroll
                event.preventDefault();
                event.stopPropagation();
                buttonRef?.current?.click?.();
              }

              rest?.onKeyUp?.(event);
            }
          })}
    >
      {decorator || loading ? (
        <span
          {...slotProps?.decorator}
          className={clsx(styles.decorator, slotProps?.decorator?.className)}
        >
          {loading ? (
            <Spinner
              color={color}
              size={["lg", "md"].includes(size) ? "sm" : "xs"}
            />
          ) : (
            decorator
          )}
        </span>
      ) : null}
      {children}
    </Component>
  );
});

Button.displayName = "Button";

export default Button;
