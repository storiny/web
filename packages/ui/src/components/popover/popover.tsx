"use client";

import {
  Arrow,
  Close,
  Content,
  Portal,
  Root,
  Trigger
} from "@radix-ui/react-popover";
import clsx from "clsx";
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
    <Root modal={false} {...rest}>
      <Trigger {...slot_props?.trigger} asChild>
        {trigger}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Content
          collisionPadding={8}
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx(styles.content, className)}
          ref={ref}
        >
          <Component>
            {children}
            <Arrow
              {...slot_props?.arrow}
              className={clsx(styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

Popover.displayName = "Popover";

export { Close };
export default Popover;
