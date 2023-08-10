"use client";

import clsx from "clsx";
import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";
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
  const shouldLogin = checkAuth && !loggedIn;
  const Component = shouldLogin ? "a" : as;
  const size = autoSize ? (isSmallerThanTablet ? "lg" : sizeProp) : sizeProp;
  const to = (rest as any)?.href
    ? `?to=${encodeURIComponent((rest as any).href)}`
    : "";

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
      onClick={(event: React.MouseEvent<HTMLButtonElement>): void => {
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
