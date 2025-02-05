"use client";

import clsx from "clsx";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./radio-group.module.scss";
import { RadioGroupProps } from "./radio-group.props";
import { RadioGroupContext } from "./radio-group-context";

const RadioGroup = forward_ref<RadioGroupProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    auto_size,
    size,
    color,
    children,
    className,
    ...rest
  } = props;

  return (
    <RadioGroupContext.Provider value={{ size, color, auto_size }}>
      <RadioGroupPrimitive.Root
        {...rest}
        asChild
        className={clsx(styles["radio-group"], className)}
        ref={ref}
      >
        <Component>{children}</Component>
      </RadioGroupPrimitive.Root>
    </RadioGroupContext.Provider>
  );
});

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
