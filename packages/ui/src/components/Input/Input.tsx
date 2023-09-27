"use client";

import clsx from "clsx";
import React from "react";

import { useMediaQuery } from "~/hooks/useMediaQuery";
import MinusIcon from "~/icons/Minus";
import PlusIcon from "~/icons/Plus";
import { breakpoints } from "~/theme/breakpoints";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Input.module.scss";
import { InputProps } from "./Input.props";
import { InputContext } from "./InputContext";

// Container

const Container = forwardRef<
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
    autoSize,
    endDecorator,
    autoFocus,
    color = "inverted",
    size: sizeProp = "md",
    type = "text",
    monospaced,
    disabled,
    className,
    slot_props,
    ...rest
  } = props;
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const innerRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState<boolean>(Boolean(autoFocus));
  const size = autoSize ? (isSmallerThanTablet ? "lg" : sizeProp) : sizeProp;

  /**
   * Handles focus
   * @param event Focus event
   */
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
    setFocused(true);
    rest?.onFocus?.(event);
  };

  /**
   * Handles blur
   * @param event Focus event
   */
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>): void => {
    setFocused(false);
    rest?.onBlur?.(event);
  };

  React.useImperativeHandle(ref, () => innerRef.current!);

  // Unfocus when the disabled prop is changed
  React.useEffect(() => {
    if (disabled) {
      setFocused(false);
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
          autoFocus={autoFocus}
          className={clsx(
            "unset",
            monospaced && "t-mono",
            styles.input,
            className
          )}
          disabled={disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={innerRef}
          type={type}
        />
        {type === "number" && size !== "sm" ? (
          <span
            {...slot_props?.spinnerContainer}
            className={clsx(
              "flex-center",
              styles["spinner-container"],
              slot_props?.spinnerContainer?.className
            )}
          >
            <button
              disabled={disabled}
              type={"button"}
              {...slot_props?.spinnerDecrementButton}
              aria-label={"decrement-value"}
              className={clsx(
                "unset",
                "focusable",
                "focus-invert",
                styles.spinner,
                slot_props?.spinnerDecrementButton?.className
              )}
              onClick={(event): void => {
                innerRef.current?.stepDown?.();
                slot_props?.spinnerDecrementButton?.onClick?.(event);
              }}
            >
              <MinusIcon />
            </button>
            <span
              aria-hidden
              {...slot_props?.spinnerSeparator}
              className={clsx(
                styles["spinner-separator"],
                slot_props?.spinnerSeparator?.className
              )}
            />
            <button
              disabled={disabled}
              type={"button"}
              {...slot_props?.spinnerIncrementButton}
              aria-label={"Increment value"}
              className={clsx(
                "unset",
                "focusable",
                "focus-invert",
                styles.spinner,
                slot_props?.spinnerIncrementButton?.className
              )}
              onClick={(event): void => {
                innerRef.current?.stepUp?.();
                slot_props?.spinnerIncrementButton?.onClick?.(event);
              }}
            >
              <PlusIcon />
            </button>
          </span>
        ) : endDecorator ? (
          <span
            {...slot_props?.endDecorator}
            className={clsx(
              "fit-w",
              "flex-center",
              disabled && styles.disabled,
              styles["end-decorator"],
              slot_props?.endDecorator?.className
            )}
          >
            {endDecorator}
          </span>
        ) : null}
      </Container>
    </InputContext.Provider>
  );
});

Input.displayName = "Input";

export default Input;
