"use client";

import clsx from "clsx";
import { Label, RadioGroup } from "radix-ui";
import React from "react";

import { use_form_field } from "~/components/form";
import { RadioGroupContext } from "~/components/radio-group";
import { use_media_query } from "~/hooks/use-media-query";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";

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
        css["flex"],
        styles.container,
        slot_props?.container?.className
      )}
    >
      <RadioGroup.Item
        {...rest}
        aria-labelledby={label_id}
        className={clsx(
          css["flex-center"],
          css["focusable"],
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
          css["flex-col"],
          styles["children-container"],
          slot_props?.children_container?.className
        )}
      >
        {label && (
          <Label.Root
            {...slot_props?.label}
            className={clsx(
              css[size === "lg" ? "t-body-1" : "t-body-2"],
              css[disabled ? "t-muted" : "t-major"],
              styles.label,
              slot_props?.label?.className
            )}
            htmlFor={item_id || radio_id}
            id={label_id}
          >
            {label}
          </Label.Root>
        )}
        {children}
      </div>
    </div>
  );
});

Radio.displayName = "Radio";

export default Radio;
