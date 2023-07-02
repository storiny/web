"use client";

import { Root } from "@radix-ui/react-toggle";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import buttonStyles from "../common/ButtonReset.module.scss";
import toggleStyles from "../common/Toggle.module.scss";
import Tooltip from "../Tooltip";
import { ToggleProps } from "./Toggle.props";

const Toggle = forwardRef<ToggleProps, "button">((props, ref) => {
  const {
    as: Component = "button",
    size = "md",
    className,
    children,
    tooltipContent,
    slotProps,
    ...rest
  } = props;
  const Container = tooltipContent ? Tooltip : React.Fragment;

  return (
    <Container
      {...(tooltipContent && {
        ...slotProps?.tooltip,
        content: tooltipContent
      })}
    >
      {/*
        Wrap in a span to avoid conflict with the data-state
        attribute from Tooltip and Toggle primitives.
      */}
      <span
        {...slotProps?.container}
        className={clsx(
          "flex-center",
          toggleStyles.container,
          slotProps?.container?.className
        )}
      >
        <Root
          {...rest}
          asChild
          className={clsx(
            buttonStyles.reset,
            "focusable",
            toggleStyles["toggle-button"],
            toggleStyles[size],
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
