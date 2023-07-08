"use client";

import clsx from "clsx";
import React from "react";

import MinusIcon from "~/icons/Minus";
import PlusIcon from "~/icons/Plus";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Input.module.scss";
import { InputProps } from "./Input.props";
import { InputContext } from "./InputContext";

// Container

const Container = forwardRef<
  NonNullable<NonNullable<InputProps["slotProps"]>["container"]>,
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
    endDecorator,
    autoFocus,
    color = "inverted",
    size = "md",
    type = "text",
    disabled,
    className,
    slotProps,
    ...rest
  } = props;
  const innerRef = React.useRef<HTMLInputElement>(null);
  const [focused, setFocused] = React.useState<boolean>(Boolean(autoFocus));

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>): void => {
    setFocused(true);
    rest?.onFocus?.(event);
  };

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
        {...slotProps?.container}
        className={clsx(
          "flex-center",
          styles.container,
          styles[color],
          styles[size],
          focused && styles.focused,
          disabled && styles.disabled,
          slotProps?.container?.className
        )}
        data-focused={String(focused)}
        ref={ref}
      >
        {decorator && (
          <span
            {...slotProps?.decorator}
            className={clsx(styles.decorator, slotProps?.decorator?.className)}
          >
            {decorator}
          </span>
        )}
        <input
          {...rest}
          autoFocus={autoFocus}
          className={clsx("unset", styles.input, className)}
          disabled={disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={innerRef}
          type={type}
        />
        {type === "number" && size !== "sm" ? (
          <span
            {...slotProps?.spinnerContainer}
            className={clsx(
              "flex-center",
              styles["spinner-container"],
              slotProps?.spinnerContainer?.className
            )}
          >
            <button
              disabled={disabled}
              type={"button"}
              {...slotProps?.spinnerDecrementButton}
              aria-label={"decrement-value"}
              className={clsx(
                "unset",
                "focusable",
                styles.spinner,
                slotProps?.spinnerDecrementButton?.className
              )}
              onClick={(event): void => {
                innerRef.current?.stepDown?.();
                slotProps?.spinnerDecrementButton?.onClick?.(event);
              }}
            >
              <MinusIcon />
            </button>
            <span
              aria-hidden
              {...slotProps?.spinnerSeparator}
              className={clsx(
                styles["spinner-separator"],
                slotProps?.spinnerSeparator?.className
              )}
            />
            <button
              disabled={disabled}
              type={"button"}
              {...slotProps?.spinnerIncrementButton}
              aria-label={"Increment value"}
              className={clsx(
                "unset",
                "focusable",
                styles.spinner,
                slotProps?.spinnerIncrementButton?.className
              )}
              onClick={(event): void => {
                innerRef.current?.stepUp?.();
                slotProps?.spinnerIncrementButton?.onClick?.(event);
              }}
            >
              <PlusIcon />
            </button>
          </span>
        ) : endDecorator ? (
          <span
            {...slotProps?.endDecorator}
            className={clsx(
              "flex-center",
              disabled && styles.disabled,
              styles["end-decorator"],
              slotProps?.endDecorator?.className
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
