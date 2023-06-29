"use client";

import { Root } from "@radix-ui/react-radio-group";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./RadioGroup.module.scss";
import { RadioGroupProps } from "./RadioGroup.props";
import { RadioGroupContext } from "./RadioGroupContext";

const RadioGroup = forwardRef<RadioGroupProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size,
    color,
    children,
    className,
    ...rest
  } = props;

  return (
    <RadioGroupContext.Provider value={{ size, color }}>
      <Root
        {...rest}
        asChild
        className={clsx(styles["radio-group"], className)}
        ref={ref}
      >
        <Component>{children}</Component>
      </Root>
    </RadioGroupContext.Provider>
  );
});

RadioGroup.displayName = "RadioGroup";

export default RadioGroup;
