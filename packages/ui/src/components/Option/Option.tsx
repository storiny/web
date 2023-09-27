"use client";

import { Item, ItemIndicator, ItemText } from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import CheckIcon from "~/icons/Check";
import { forwardRef } from "~/utils/forwardRef";

import rightSlotStyles from "../common/RightSlot.module.scss";
import styles from "./Option.module.scss";
import { OptionProps } from "./Option.props";

const Option = forwardRef<OptionProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    rightSlot,
    decorator,
    children,
    className,
    slot_props,
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
            {...slot_props?.decorator}
            className={clsx(styles.decorator, slot_props?.decorator?.className)}
          >
            {decorator}
          </span>
        )}
        <ItemText {...slot_props?.text}>{children}</ItemText>
        {rightSlot && (
          <span
            {...slot_props?.rightSlot}
            className={clsx(
              rightSlotStyles["right-slot"],
              slot_props?.rightSlot?.className
            )}
          >
            {rightSlot}
          </span>
        )}
        <ItemIndicator
          {...slot_props?.indicator}
          className={clsx(styles.indicator, slot_props?.indicator?.className)}
        >
          <CheckIcon />
        </ItemIndicator>
      </Component>
    </Item>
  );
});

Option.displayName = "Option";

export default Option;
