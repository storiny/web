"use client";

import clsx from "clsx";
import { Select } from "radix-ui";
import React from "react";

import CheckIcon from "~/icons/check";
import { forward_ref } from "~/utils/forward-ref";

import right_slot_styles from "../common/right-slot.module.scss";
import styles from "./option.module.scss";
import { OptionProps } from "./option.props";

const Option = forward_ref<OptionProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    right_slot,
    decorator,
    children,
    className,
    slot_props,
    ...rest
  } = props;

  return (
    <Select.Item
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
        <Select.ItemText {...slot_props?.text}>{children}</Select.ItemText>
        {right_slot && (
          <span
            {...slot_props?.right_slot}
            className={clsx(
              right_slot_styles["right-slot"],
              slot_props?.right_slot?.className
            )}
          >
            {right_slot}
          </span>
        )}
        <Select.ItemIndicator
          {...slot_props?.indicator}
          className={clsx(styles.indicator, slot_props?.indicator?.className)}
        >
          <CheckIcon />
        </Select.ItemIndicator>
      </Component>
    </Select.Item>
  );
});

Option.displayName = "Option";

export default Option;
