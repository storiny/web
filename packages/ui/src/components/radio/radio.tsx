"use client";

import { Root as Label } from "@radix-ui/react-label";
import { Item } from "@radix-ui/react-radio-group";
import clsx from "clsx";
import React from "react";

import { use_form_field } from "~/components/form";
import { RadioGroupContext } from "~/components/radio-group";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";

import styles from "./radio.module.scss";
import { RadioProps } from "./radio.props";

const Radio = React.forwardRef<HTMLButtonElement, RadioProps>((props, ref) => {
  const {
    color: color_prop = "inverted",
    size: native_size_prop = "md",
    auto_size: auto_size_prop,
    label,
    className,
    disabled,
    slot_props,
    children,
    ...rest
  } = props;
  const is_smaller_than_tablet = use_media_query(BREAKPOINTS.down("tablet"));
  const radio_id = React.useId();
  const label_id = React.useId();
  const radio_group_context = React.useContext(RadioGroupContext) || {};
  const { item_id } = use_form_field(true);
  const auto_size = radio_group_context.auto_size || auto_size_prop;
  const color = radio_group_context.color || color_prop;
  const size_prop = radio_group_context.size || native_size_prop;
  const size = auto_size
    ? is_smaller_than_tablet
      ? "lg"
      : size_prop
    : size_prop;

  return (
    <div
      {...slot_props?.container}
      className={clsx(
        "flex",
        styles.container,
        slot_props?.container?.className
      )}
    >
      <Item
        {...rest}
        aria-labelledby={label_id}
        className={clsx(
          "flex-center",
          "focusable",
          styles.radio,
          styles[color],
          styles[size],
          className
        )}
        disabled={disabled}
        id={item_id || radio_id}
        ref={ref}
      />
      <div
        {...slot_props?.children_container}
        className={clsx(
          "flex-col",
          styles["children-container"],
          slot_props?.children_container?.className
        )}
      >
        {label && (
          <Label
            {...slot_props?.label}
            className={clsx(
              size === "lg" ? "t-body-1" : "t-body-2",
              disabled ? "t-muted" : "t-major",
              styles.label,
              slot_props?.label?.className
            )}
            htmlFor={item_id || radio_id}
            id={label_id}
          >
            {label}
          </Label>
        )}
        {children}
      </div>
    </div>
  );
});

Radio.displayName = "Radio";

export default Radio;
