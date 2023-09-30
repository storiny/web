"use client";

import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./textarea.module.scss";
import { TextareaProps } from "./textarea.props";

// Container

const Container = forward_ref<
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
      autoFocus: auto_focus,
      color = "inverted",
      size = "md",
      end_decorator,
      className,
      disabled,
      slot_props,
      ...rest
    } = props;
    const [focused, set_focused] = React.useState<boolean>(Boolean(auto_focus));

    /**
     * Handles focus event
     * @param event Event
     */
    const handle_focus = (
      event: React.FocusEvent<HTMLTextAreaElement>
    ): void => {
      set_focused(true);
      rest?.onFocus?.(event);
    };

    /**
     * Handles blur event
     * @param event Event
     */
    const handle_blur = (
      event: React.FocusEvent<HTMLTextAreaElement>
    ): void => {
      set_focused(false);
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
          autoFocus={auto_focus}
          className={clsx("unset", styles.textarea, className)}
          disabled={disabled}
          onBlur={handle_blur}
          onFocus={handle_focus}
          ref={ref}
        />
        {end_decorator}
      </Container>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
