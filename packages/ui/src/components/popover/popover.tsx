"use client";

import clsx from "clsx";
import { Popover as PopoverPrimitive } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./popover.module.scss";
import { PopoverProps } from "./popover.props";

const Popover = forward_ref<PopoverProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    slot_props,
    ...rest
  } = props;

  return (
    <PopoverPrimitive.Root modal={false} {...rest}>
      <PopoverPrimitive.Trigger {...slot_props?.trigger} asChild>
        {trigger}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal {...slot_props?.portal}>
        <PopoverPrimitive.Content
          collisionPadding={12}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(styles.content, className)}
          ref={ref}
        >
          <Component>
            {children}
            <PopoverPrimitive.Arrow
              {...slot_props?.arrow}
              className={clsx(styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
});

Popover.displayName = "Popover";

export const Close = PopoverPrimitive.Close;
export default Popover;
