"use client";

import clsx from "clsx";
import { Select as SelectPrimitive } from "radix-ui";
import React from "react";

import { use_media_query } from "~/hooks/use-media-query";
import ChevronIcon from "~/icons/chevron";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

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
    <SelectPrimitive.Root {...rest} disabled={input_disabled || disabled}>
      {render_trigger(
        <SelectPrimitive.Trigger
          {...slot_props?.trigger}
          className={clsx(
            css["focusable"],
            css["flex-center"],
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
          <SelectPrimitive.Value {...slot_props?.value} data-value>
            {value_children}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon
            {...slot_props?.icon}
            className={clsx(styles.icon, slot_props?.icon?.className)}
          >
            <ChevronIcon style={{ transform: "rotate(180deg)" }} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
      )}
      <SelectPrimitive.Portal {...slot_props?.portal}>
        <SelectPrimitive.Content
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
            <SelectPrimitive.ScrollUpButton
              {...slot_props?.scroll_up_button}
              className={clsx(
                css["flex-center"],
                styles["scroll-button"],
                slot_props?.scroll_up_button?.className
              )}
            >
              <ChevronIcon />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport
              {...slot_props?.viewport}
              className={clsx(styles.viewport, slot_props?.viewport?.className)}
            >
              {children}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton
              {...slot_props?.scroll_down_button}
              className={clsx(
                css["flex-center"],
                styles["scroll-button"],
                slot_props?.scroll_down_button?.className
              )}
            >
              <ChevronIcon style={{ transform: "rotate(180deg)" }} />
            </SelectPrimitive.ScrollDownButton>
          </Component>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});

Select.displayName = "Select";

export default Select;
