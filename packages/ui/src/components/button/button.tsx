"use client";

import { VIBRATION_PATTERNS } from "@storiny/shared";
import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { is_test_env } from "@storiny/shared/src/utils/is-test-env";
import clsx from "clsx";
import { usePathname as use_pathname } from "next/navigation";
import React from "react";

import { use_media_query } from "~/hooks/use-media-query";
import { select_haptic_feedback } from "~/redux/features";
import { select_is_logged_in } from "~/redux/features/auth/selectors";
import { use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import button_styles from "../common/button-reset.module.scss";
import Spinner from "../spinner";
import styles from "./button.module.scss";
import { ButtonProps } from "./button.props";

const Button = forward_ref<ButtonProps, "button">((props, ref) => {
  const {
    as = "button",
    auto_size,
    children,
    className,
    loading,
    disabled: disabled_prop,
    color = "inverted",
    size: size_prop = "md",
    variant = "rigid",
    type = "button",
    decorator,
    check_auth,
    onClick: on_click,
    slot_props,
    ...rest
  } = props;
  const pathname = use_pathname();
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const button_ref = React.useRef<HTMLElement>(null);
  const disabled = Boolean(disabled_prop || loading);
  const logged_in = use_app_selector(select_is_logged_in);
  const haptic_feedback = use_app_selector(select_haptic_feedback);
  const should_login = check_auth && !logged_in;
  const Component = should_login ? "a" : as;
  const size = auto_size
    ? is_smaller_than_tablet
      ? "lg"
      : size_prop
    : size_prop;
  const to =
    typeof (rest as any)?.href === "string"
      ? `?to=${encodeURIComponent((rest as any).href)}`
      : pathname !== "/"
        ? `?to=${encodeURIComponent(pathname)}`
        : "";

  /**
   * Handles click event
   * @param event Click event
   */
  const handle_click = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (should_login) {
      if (is_test_env()) {
        event.preventDefault(); // Prevent navigation when testing
      }
    } else {
      on_click?.(event);
    }

    try {
      if ("vibrate" in navigator && haptic_feedback) {
        navigator.vibrate(VIBRATION_PATTERNS.click);
      }
    } catch (e) {
      dev_console.error(e);
    }
  };

  React.useImperativeHandle(ref, () => button_ref.current!);

  return (
    <Component
      {...rest}
      aria-disabled={String(disabled)}
      className={clsx(
        button_styles.reset,
        css["focusable"],
        `variant-${variant}`,
        `color-${color}`,
        styles.button,
        loading && [styles.loading, "loading"],
        disabled && [styles.disabled, "disabled"],
        styles[size],
        className
      )}
      onClick={handle_click}
      ref={button_ref}
      tabIndex={disabled ? -1 : 0}
      {...(should_login
        ? {
            href: `/login${to}`
          }
        : {})}
      {...(Component === "button"
        ? { type, disabled }
        : {
            role: "button",
            // Trigger button click when space-bar is pressed
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>): void => {
              // Space-bar key
              if (event.key === " " && !disabled) {
                // Prevent page scroll
                event.preventDefault();
                event.stopPropagation();
                button_ref?.current?.click?.();
              }

              rest?.onKeyUp?.(event);
            }
          })}
    >
      {decorator || loading ? (
        <span
          {...slot_props?.decorator}
          className={clsx(styles.decorator, slot_props?.decorator?.className)}
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
