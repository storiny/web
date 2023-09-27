"use client";

import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Textarea.module.scss";
import { TextareaProps } from "./Textarea.props";

// Container

const Container = forwardRef<
  NonNullable<NonNullable<TextareaProps["slot_props"]>["container"]>,
  "div"
>((props, ref) => {
  const { as: Component = "div", children, ...rest } = props;
  return (
    <Component {...rest} ref={ref}>
      {children}
    </Component>
  );
});

// Textarea

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const {
      autoFocus,
      color = "inverted",
      size = "md",
      endDecorator,
      className,
      disabled,
      slot_props,
      ...rest
    } = props;
    const [focused, setFocused] = React.useState<boolean>(Boolean(autoFocus));

    const handleFocus = (
      event: React.FocusEvent<HTMLTextAreaElement>
    ): void => {
      setFocused(true);
      rest?.onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>): void => {
      setFocused(false);
      rest?.onBlur?.(event);
    };

    return (
      <Container
        {...slot_props?.container}
        className={clsx(
          "flex-col",
          styles.container,
          styles[color],
          styles[size],
          focused && styles.focused,
          disabled && styles.disabled,
          slot_props?.container?.className
        )}
        data-focused={String(focused)}
      >
        <textarea
          {...rest}
          autoFocus={autoFocus}
          className={clsx("unset", styles.textarea, className)}
          disabled={disabled}
          onBlur={handleBlur}
          onFocus={handleFocus}
          ref={ref}
        />
        {endDecorator}
      </Container>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
