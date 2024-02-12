"use client";

import { Indicator, Root } from "@radix-ui/react-checkbox";
import { Root as Label } from "@radix-ui/react-label";
import clsx from "clsx";
import React from "react";

import { use_form_field } from "~/components/form";
import CheckIcon from "~/icons/check";
import css from "~/theme/main.module.scss";

import styles from "./checkbox.module.scss";
import { CheckboxProps } from "./checkbox.props";

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (props, ref) => {
    const {
      color = "inverted",
      size = "md",
      auto_size,
      label,
      className,
      disabled,
      slot_props,
      ...rest
    } = props;
    const checkbox_id = React.useId();
    const label_id = React.useId();
    const { item_id } = use_form_field(true);

    return (
      <div
        {...slot_props?.container}
        className={clsx(
          css["fit-w"],
          css["flex-center"],
          slot_props?.container?.className
        )}
      >
        <Root
          {...rest}
          aria-labelledby={label_id}
          className={clsx(
            css["flex-center"],
            css["focusable"],
            styles.checkbox,
            styles[color],
            styles[size],
            auto_size && styles["auto-size"],
            className
          )}
          disabled={disabled}
          id={item_id || checkbox_id}
          ref={ref}
        >
          <Indicator
            {...slot_props?.indicator}
            className={clsx(
              css["flex-center"],
              styles.indicator,
              slot_props?.indicator?.className
            )}
          >
            <CheckIcon />
          </Indicator>
        </Root>
        {label && (
          <Label
            {...slot_props?.label}
            className={clsx(
              css[size === "lg" ? "t-body-1" : "t-body-2"],
              css[disabled ? "t-muted" : "t-major"],
              styles.label,
              slot_props?.label?.className
            )}
            htmlFor={item_id || checkbox_id}
            id={label_id}
          >
            {label}
          </Label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
