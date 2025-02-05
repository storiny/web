"use client";

import clsx from "clsx";
import { Toggle as TogglePrimitive } from "radix-ui";
import React from "react";

import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import button_styles from "../common/button-reset.module.scss";
import toggle_styles from "../common/toggle.module.scss";
import Tooltip from "../tooltip";
import { ToggleProps } from "./toggle.props";

const Toggle = forward_ref<ToggleProps, "button">((props, ref) => {
  const {
    as: Component = "button",
    size = "md",
    className,
    children,
    tooltip_content,
    slot_props,
    disabled,
    ...rest
  } = props;
  const Container = tooltip_content ? Tooltip : React.Fragment;

  return (
    <Container
      {...(tooltip_content && {
        ...slot_props?.tooltip,
        content: tooltip_content
      })}
      {...(disabled && {
        open: false
      })}
    >
      {/*
        Wrap in a span to avoid conflict with the data-state
        attribute from Tooltip and Toggle primitives.
      */}
      <span
        {...slot_props?.container}
        className={clsx(
          css["flex-center"],
          toggle_styles.container,
          slot_props?.container?.className
        )}
      >
        <TogglePrimitive.Root
          {...rest}
          asChild
          className={clsx(
            button_styles.reset,
            css["focusable"],
            toggle_styles["toggle-button"],
            toggle_styles[size],
            className
          )}
          disabled={disabled}
          ref={ref}
        >
          <Component>{children}</Component>
        </TogglePrimitive.Root>
      </span>
    </Container>
  );
});

Toggle.displayName = "Toggle";

export default Toggle;
