"use client";

import clsx from "clsx";
import React from "react";

import { selectLoggedIn } from "~/redux/features/auth/selectors";
import { useAppSelector } from "~/redux/hooks";
import { forwardRef } from "~/utils/forwardRef";

import buttonStyles from "../common/ButtonReset.module.scss";
import { InputContext } from "../Input";
import Spinner from "../Spinner";
import styles from "./IconButton.module.scss";
import { IconButtonProps } from "./IconButton.props";

const IconButton = forwardRef<IconButtonProps, "button">((props, ref) => {
  const {
    as = "button",
    children,
    loading,
    className,
    color = "inverted",
    size = "md",
    variant = "rigid",
    type = "button",
    disabled: disabledProp,
    checkAuth,
    onClick,
    ...rest
  } = props;
  const buttonRef = React.useRef<HTMLElement>(null);
  const {
    size: inputSize,
    color: inputColor,
    disabled: inputDisabled
  } = React.useContext(InputContext) || {};
  const disabled = Boolean(inputDisabled || disabledProp || loading);
  const loggedIn = useAppSelector(selectLoggedIn);
  const shouldLogin = checkAuth && !loggedIn;
  const Component = shouldLogin ? "a" : as;

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
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        shouldLogin
          ? // Prevent navigation when testing
            process.env.NODE_ENV === "test"
            ? event.preventDefault()
            : undefined
          : onClick?.(event);
      }}
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
            onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => {
              // Space-bar key
              if (event.key === " " && !disabled) {
                // Prevent page scroll
                event.preventDefault();
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
