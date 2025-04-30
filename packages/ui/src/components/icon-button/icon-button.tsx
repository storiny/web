"use client";

import { VIBRATION_PATTERNS } from "@storiny/shared";
import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { get_blog_url } from "@storiny/shared/src/utils/get-blog-url";
import { is_test_env } from "@storiny/shared/src/utils/is-test-env";
import { use_blog_context } from "@storiny/web/src/common/context/blog";
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
import { InputContext } from "../input";
import Spinner from "../spinner";
import styles from "./icon-button.module.scss";
import { IconButtonProps } from "./icon-button.props";

const IconButton = forward_ref<IconButtonProps, "button">((props, ref) => {
  const {
    as = "button",
    auto_size,
    children,
    loading,
    className,
    color = "inverted",
    size: size_prop = "md",
    variant = "rigid",
    type = "button",
    disabled: disabled_prop,
    check_auth,
    onClick: on_click,
    ...rest
  } = props;
  const pathname = use_pathname();
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const button_ref = React.useRef<HTMLElement>(null);
  const {
    size: input_size,
    color: input_color,
    disabled: input_disabled
  } = React.useContext(InputContext) || {}; // Size when the button is rendered as the `end_decorator` of an `Input` component
  const disabled = Boolean(input_disabled || disabled_prop || loading);
  const logged_in = use_app_selector(select_is_logged_in);
  const haptic_feedback = use_app_selector(select_haptic_feedback);
  const blog = use_blog_context();
  const should_login = check_auth && !logged_in;
  const Component = should_login ? "a" : as;
  const size = auto_size
    ? is_smaller_than_tablet
      ? "lg"
      : size_prop
    : size_prop;
  const to =
    pathname && pathname !== "/"
      ? `?to=${encodeURIComponent(
          `${blog?.id ? `${get_blog_url(blog)}` : ""}${pathname}`
        )}`
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
        `color-${input_color || color}`,
        styles["icon-button"],
        loading && [styles.loading, "loading"],
        disabled && [styles.disabled, "disabled"],
        styles[input_size || size],
        className
      )}
      onClick={handle_click}
      ref={button_ref}
      tabIndex={disabled ? -1 : 0}
      {...(should_login ? { href: `/login${to}` } : {})}
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
