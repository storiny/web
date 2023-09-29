"use client";

import clsx from "clsx";
import React from "react";

import { use_media_query } from "src/hooks/use-media-query";
import MinusIcon from "~/icons/Minus";
import PlusIcon from "~/icons/Plus";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { forward_ref } from "src/utils/forward-ref";

import styles from "./input.module.scss";
import { InputProps } from "./input.props";
import { InputContext } from "./input-context";

// Container

const Container = forward_ref<
  NonNullable<NonNullable<InputProps["slot_props"]>["container"]>,
  "div"
>((props, ref) => {
  const { as: Component = "div", children, ...rest } = props;
  return (
    <Component {...rest} ref={ref}>
      {children}
    </Component>
  );
});

// Input

const Input = React.forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    decorator,
    auto_size,
    end_decorator,
    autoFocus: auto_focus,
    color = "inverted",
    size: size_prop = "md",
    type = "text",
    monospaced,
    disabled,
    className,
    slot_props,
    ...rest
  } = props;
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const inner_ref = React.useRef<HTMLInputElement>(null);
  const [focused, set_focused] = React.useState<boolean>(Boolean(auto_focus));
  const size = auto_size
    ? is_smaller_than_tablet
      ? "lg"
      : size_prop
    : size_prop;

  /**
   * Handles focus
   * @param event Focus event
   */
  const handle_focus = (event: React.FocusEvent<HTMLInputElement>): void => {
    set_focused(true);
    rest?.onFocus?.(event);
  };

  /**
   * Handles blur
   * @param event Focus event
   */
  const handle_blur = (event: React.FocusEvent<HTMLInputElement>): void => {
    set_focused(false);
    rest?.onBlur?.(event);
  };

  React.useImperativeHandle(ref, () => inner_ref.current!);

  // Unfocus when the disabled prop is changed
  React.useEffect(() => {
    if (disabled) {
      set_focused(false);
    }
  }, [disabled]);

  return (
    <InputContext.Provider value={{ color, size, disabled }}>
      <Container
        {...slot_props?.container}
        className={clsx(
          "flex-center",
          styles.container,
          styles[color],
          styles[size],
          focused && styles.focused,
          disabled && styles.disabled,
          slot_props?.container?.className
        )}
        data-focused={String(focused)}
        ref={ref}
      >
        {decorator && (
          <span
            {...slot_props?.decorator}
            className={clsx(styles.decorator, slot_props?.decorator?.className)}
          >
            {decorator}
          </span>
        )}
        <input
          {...rest}
          autoFocus={auto_focus}
          className={clsx(
            "unset",
            monospaced && "t-mono",
            styles.input,
            className
          )}
          disabled={disabled}
          onBlur={handle_blur}
          onFocus={handle_focus}
          ref={inner_ref}
          type={type}
        />
        {type === "number" && size !== "sm" ? (
          <span
            {...slot_props?.spinner_container}
            className={clsx(
              "flex-center",
              styles["spinner-container"],
              slot_props?.spinner_container?.className
            )}
          >
            <button
              disabled={disabled}
              type={"button"}
              {...slot_props?.spinner_decrement_button}
              aria-label={"decrement-value"}
              className={clsx(
                "unset",
                "focusable",
                "focus-invert",
                styles.spinner,
                slot_props?.spinner_decrement_button?.className
              )}
              onClick={(event): void => {
                inner_ref.current?.stepDown?.();
                slot_props?.spinner_decrement_button?.onClick?.(event);
              }}
            >
              <MinusIcon />
            </button>
            <span
              aria-hidden
              {...slot_props?.spinner_separator}
              className={clsx(
                styles["spinner-separator"],
                slot_props?.spinner_separator?.className
              )}
            />
            <button
              disabled={disabled}
              type={"button"}
              {...slot_props?.spinner_increment_button}
              aria-label={"Increment value"}
              className={clsx(
                "unset",
                "focusable",
                "focus-invert",
                styles.spinner,
                slot_props?.spinner_increment_button?.className
              )}
              onClick={(event): void => {
                inner_ref.current?.stepUp?.();
                slot_props?.spinner_increment_button?.onClick?.(event);
              }}
            >
              <PlusIcon />
            </button>
          </span>
        ) : end_decorator ? (
          <span
            {...slot_props?.end_decorator}
            className={clsx(
              "fit-w",
              "flex-center",
              disabled && styles.disabled,
              styles["end-decorator"],
              slot_props?.end_decorator?.className
            )}
          >
            {end_decorator}
          </span>
        ) : null}
      </Container>
    </InputContext.Provider>
  );
});

Input.displayName = "Input";

export default Input;
