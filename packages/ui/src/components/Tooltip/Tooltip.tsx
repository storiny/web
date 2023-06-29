"use client";

import { Arrow, Content, Portal, Root, Trigger } from "@radix-ui/react-tooltip";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Tooltip.module.scss";
import { TooltipProps } from "./Tooltip.props";

export { TooltipProvider } from "@radix-ui/react-tooltip";

const Tooltip = forwardRef<TooltipProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    children,
    className,
    content,
    slotProps,
    ...rest
  } = props;

  return (
    <Root {...rest}>
      <Trigger {...slotProps?.trigger} asChild>
        {children}
      </Trigger>
      <Portal {...slotProps?.portal}>
        <Content
          sideOffset={5}
          {...slotProps?.content}
          asChild
          className={clsx("flex-center", styles.content, className)}
          ref={ref}
        >
          <Component>
            {content}
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

Tooltip.displayName = "Tooltip";

export default Tooltip;
