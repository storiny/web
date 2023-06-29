"use client";

import { Root as Label } from "@radix-ui/react-label";
import { Item } from "@radix-ui/react-radio-group";
import clsx from "clsx";
import React from "react";

import { useFormField } from "~/components/Form";
import { RadioGroupContext } from "~/components/RadioGroup";

import styles from "./Radio.module.scss";
import { RadioProps } from "./Radio.props";

const Radio = React.forwardRef<HTMLButtonElement, RadioProps>((props, ref) => {
  const {
    color: colorProp = "inverted",
    size: sizeProp = "md",
    label,
    className,
    disabled,
    slotProps,
    ...rest
  } = props;
  const radioId = React.useId();
  const labelId = React.useId();
  const radioGroupContext = React.useContext(RadioGroupContext) || {};
  const { itemId } = useFormField(true);
  const color = radioGroupContext.color || colorProp;
  const size = radioGroupContext.size || sizeProp;

  return (
    <div
      {...slotProps?.container}
      className={clsx(
        "flex-center",
        styles.container,
        slotProps?.container?.className
      )}
    >
      <Item
        {...rest}
        aria-labelledby={labelId}
        className={clsx(
          "flex-center",
          "focusable",
          styles.radio,
          styles[color],
          styles[size],
          className
        )}
        disabled={disabled}
        id={itemId || radioId}
        ref={ref}
      />
      {label && (
        <Label
          {...slotProps?.label}
          className={clsx(
            size === "lg" ? "t-body-1" : "t-body-2",
            disabled ? "t-muted" : "t-major",
            styles.label,
            slotProps?.label?.className
          )}
          htmlFor={itemId || radioId}
          id={labelId}
        >
          {label}
        </Label>
      )}
    </div>
  );
});

Radio.displayName = "Radio";

export default Radio;
