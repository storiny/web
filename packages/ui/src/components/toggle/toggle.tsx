"use client";

import { Root } from "@radix-ui/react-toggle";
import clsx from "clsx";
import React from "react";

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
    ...rest
  } = props;
  const Container = tooltip_content ? Tooltip : React.Fragment;

  return (
    <Container
      {...(tooltip_content && {
        ...slot_props?.tooltip,
        content: tooltip_content
      })}
    >
      {/*
        Wrap in a span to avoid conflict with the data-state
        attribute from Tooltip and Toggle primitives.
      */}
      <span
        {...slot_props?.container}
        className={clsx(
          "flex-center",
          toggle_styles.container,
          slot_props?.container?.className
        )}
      >
        <Root
          {...rest}
          asChild
          className={clsx(
            button_styles.reset,
            "focusable",
            toggle_styles["toggle-button"],
            toggle_styles[size],
            className
          )}
          ref={ref}
        >
          <Component>{children}</Component>
        </Root>
      </span>
    </Container>
  );
});

Toggle.displayName = "Toggle";

export default Toggle;
