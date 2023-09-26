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
import { InputContext } from "../Input";
import Spinner from "../Spinner";
import styles from "./IconButton.module.scss";
import { IconButtonProps } from "./IconButton.props";

const IconButton = forwardRef<IconButtonProps, "button">((props, ref) => {
  const {
    as = "button",
    autoSize,
    children,
    loading,
    className,
    color = "inverted",
    size: sizeProp = "md",
    variant = "rigid",
    type = "button",
    disabled: disabledProp,
    checkAuth,
    onClick,
    ...rest
  } = props;
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const buttonRef = React.useRef<HTMLElement>(null);
  const {
    size: inputSize,
    color: inputColor,
    disabled: inputDisabled
  } = React.useContext(InputContext) || {}; // Size when the button is rendered as the `endDecorator` of an `Input` component
  const disabled = Boolean(inputDisabled || disabledProp || loading);
  const loggedIn = useAppSelector(selectLoggedIn);
  const haptic_feedback = useAppSelector(selectHapticFeedback);
  const shouldLogin = checkAuth && !loggedIn;
  const Component = shouldLogin ? "a" : as;
  const size = autoSize ? (isSmallerThanTablet ? "lg" : sizeProp) : sizeProp;

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
        `color-${inputColor || color}`,
        styles["icon-button"],
        loading && [styles.loading, "loading"],
        disabled && [styles.disabled, "disabled"],
        styles[inputSize || size],
        className
      )}
      onClick={handleClick}
      ref={buttonRef}
      tabIndex={disabled ? -1 : 0}
      {...(shouldLogin
        ? {
            href: "/login"
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
      {loading ? (
        <Spinner
          color={color}
          size={["lg", "md"].includes(size) ? "sm" : "xs"}
        />
      ) : (
        children
      )}
    </Component>
  );
});

IconButton.displayName = "IconButton";

export default IconButton;
