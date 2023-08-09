"use client";

import { Indicator, Root } from "@radix-ui/react-checkbox";
import { Root as Label } from "@radix-ui/react-label";
import clsx from "clsx";
import React from "react";

import { useFormField } from "~/components/Form";
import CheckIcon from "~/icons/Check";

import styles from "./Checkbox.module.scss";
import { CheckboxProps } from "./Checkbox.props";

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (props, ref) => {
    const {
      color = "inverted",
      size = "md",
      label,
      className,
      disabled,
      slotProps,
      ...rest
    } = props;
    const checkboxId = React.useId();
    const labelId = React.useId();
    const { itemId } = useFormField(true);

    return (
      <div
        {...slotProps?.container}
        className={clsx(
          "fit-w",
          "flex-center",
          slotProps?.container?.className
        )}
      >
        <Root
          {...rest}
          aria-labelledby={labelId}
          className={clsx(
            "flex-center",
            "focusable",
            styles.checkbox,
            styles[color],
            styles[size],
            className
          )}
          disabled={disabled}
          id={itemId || checkboxId}
          ref={ref}
        >
          <Indicator
            {...slotProps?.indicator}
            className={clsx(
              "flex-center",
              styles.indicator,
              slotProps?.indicator?.className
            )}
          >
            <CheckIcon />
          </Indicator>
        </Root>
        {label && (
          <Label
            {...slotProps?.label}
            className={clsx(
              size === "lg" ? "t-body-1" : "t-body-2",
              disabled ? "t-muted" : "t-major",
              styles.label,
              slotProps?.label?.className
            )}
            htmlFor={itemId || checkboxId}
            id={labelId}
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
