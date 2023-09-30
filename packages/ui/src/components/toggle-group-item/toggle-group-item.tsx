"use client";

import { Item } from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import button_styles from "../common/button-reset.module.scss";
import toggle_styles from "../common/toggle.module.scss";
import { ToggleGroupContext } from "../toggle-group";
import Tooltip from "../tooltip";
import { ToggleGroupItemProps } from "./toggle-group-item.props";

const ToggleGroupItem = forward_ref<ToggleGroupItemProps, "button">(
  (props, ref) => {
    const {
      as: Component = "button",
      size,
      className,
      children,
      tooltip_content,
      slot_props,
      ...rest
    } = props;
    const Container = tooltip_content ? Tooltip : React.Fragment;
    const { size: toggle_group_size } =
      React.useContext(ToggleGroupContext) || {};

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
          <Item
            {...rest}
            asChild
            className={clsx(
              button_styles.reset,
              "focusable",
              toggle_styles["toggle-button"],
              toggle_styles[size || toggle_group_size || "md"],
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
