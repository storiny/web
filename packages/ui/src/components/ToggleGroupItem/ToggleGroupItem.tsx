"use client";

import { Item } from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import buttonStyles from "../common/ButtonReset.module.scss";
import toggleStyles from "../common/Toggle.module.scss";
import { ToggleGroupContext } from "../ToggleGroup";
import Tooltip from "../Tooltip";
import { ToggleGroupItemProps } from "./ToggleGroupItem.props";

const ToggleGroupItem = forwardRef<ToggleGroupItemProps, "button">(
  (props, ref) => {
    const {
      as: Component = "button",
      size,
      className,
      children,
      tooltipContent,
      slot_props,
      ...rest
    } = props;
    const Container = tooltipContent ? Tooltip : React.Fragment;
    const { size: toggleGroupSize } =
      React.useContext(ToggleGroupContext) || {};

    return (
      <Container
        {...(tooltipContent && {
          ...slot_props?.tooltip,
          content: tooltipContent
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
            toggleStyles.container,
            slot_props?.container?.className
          )}
        >
          <Item
            {...rest}
            asChild
            className={clsx(
              buttonStyles.reset,
              "focusable",
              toggleStyles["toggle-button"],
              toggleStyles[size || toggleGroupSize || "md"],
              className
            )}
            ref={ref}
          >
            <Component>{children}</Component>
          </Item>
        </span>
      </Container>
    );
  }
);

ToggleGroupItem.displayName = "ToggleGroupItem";

export default ToggleGroupItem;
