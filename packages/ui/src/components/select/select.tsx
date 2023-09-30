"use client";

import {
  Content,
  Icon,
  Portal,
  Root,
  ScrollDownButton,
  ScrollUpButton,
  Trigger,
  Value,
  Viewport
} from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import { use_media_query } from "src/hooks/use-media-query";
import ChevronIcon from "src/icons/chevron";
import { BREAKPOINTS } from "~/theme/breakpoints";
import { forward_ref } from "src/utils/forward-ref";

import { InputContext } from "../input";
import styles from "./select.module.scss";
import { SelectProps } from "./select.props";

const Select = forward_ref<SelectProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size: size_prop = "md",
    color = "inverted",
    auto_size,
    render_trigger = (trigger): React.ReactNode => trigger,
    value_children,
    disabled,
    children,
    slot_props,
    ...rest
  } = props;
  const {
    color: input_color,
    size: input_size,
    disabled: input_disabled
  } = React.useContext(InputContext) || {}; // Size when the select is rendered as the `end_decorator` of an `Input` component
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const size = auto_size
    ? is_smaller_than_tablet
      ? "lg"
      : size_prop
    : size_prop;

  return (
    <Root {...rest} disabled={input_disabled || disabled}>
      {render_trigger(
        <Trigger
          {...slot_props?.trigger}
          className={clsx(
            "focusable",
            "flex-center",
            styles.trigger,
            styles[input_size || size],
            styles[input_color || color],
            // Check if inside context provider
            Boolean(input_size) && styles.context,
            slot_props?.trigger?.className
          )}
          data-select-trigger={"true"}
          disabled={disabled}
        >
          <Value {...slot_props?.value} data-value>
            {value_children}
          </Value>
          <Icon
            {...slot_props?.icon}
            className={clsx(styles.icon, slot_props?.icon?.className)}
          >
            <ChevronIcon style={{ transform: "rotate(180deg)" }} />
          </Icon>
        </Trigger>
      )}
      <Portal {...slot_props?.portal}>
        <Content
          {...slot_props?.content}
          asChild
          className={clsx(
            styles.content,
            styles[input_size || size],
            slot_props?.content?.className
          )}
          ref={ref}
        >
          <Component>
            <ScrollUpButton
              {...slot_props?.scroll_up_button}
              className={clsx(
                "flex-center",
                styles["scroll-button"],
                slot_props?.scroll_up_button?.className
              )}
            >
              <ChevronIcon />
            </ScrollUpButton>
            <Viewport
              {...slot_props?.viewport}
              className={clsx(styles.viewport, slot_props?.viewport?.className)}
            >
              {children}
            </Viewport>
            <ScrollDownButton
              {...slot_props?.scroll_down_button}
              className={clsx(
                "flex-center",
                styles["scroll-button"],
                slot_props?.scroll_down_button?.className
              )}
            >
              <ChevronIcon style={{ transform: "rotate(180deg)" }} />
            </ScrollDownButton>
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

Select.displayName = "Select";

export default Select;
