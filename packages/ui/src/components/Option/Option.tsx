"use client";

import { Item, ItemIndicator, ItemText } from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import CheckIcon from "~/icons/Check";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Option.module.scss";
import { OptionProps } from "./Option.props";

const Option = forwardRef<OptionProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    decorator,
    children,
    className,
    slotProps,
    ...rest
  } = props;

  return (
    <Item
      {...rest}
      asChild
      className={clsx(styles.option, className)}
      ref={ref}
    >
      <Component>
        {decorator && (
          <span
            {...slotProps?.decorator}
            className={clsx(styles.decorator, slotProps?.decorator?.className)}
          >
            {decorator}
          </span>
        )}
        <ItemText {...slotProps?.text}>{children}</ItemText>
        <ItemIndicator
          {...slotProps?.indicator}
          className={clsx(styles.indicator, slotProps?.indicator?.className)}
        >
          <CheckIcon />
        </ItemIndicator>
      </Component>
    </Item>
  );
});

Option.displayName = "Option";

export default Option;
