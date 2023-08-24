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

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Popover.module.scss";
import { PopoverProps } from "./Popover.props";

const Popover = forwardRef<PopoverProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    className,
    children,
    trigger,
    slotProps,
    ...rest
  } = props;

  return (
    <Root modal={false} {...rest}>
      <Trigger {...slotProps?.trigger} asChild>
        {trigger}
      </Trigger>
      <Portal {...slotProps?.portal}>
        <Content
          collisionPadding={8}
          sideOffset={5}
          {...slotProps?.content}
          asChild
          className={clsx(styles.content, className)}
          ref={ref}
        >
          <Component>
            {children}
            <Arrow
              {...slotProps?.arrow}
              className={clsx(styles.arrow, slotProps?.arrow?.className)}
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
