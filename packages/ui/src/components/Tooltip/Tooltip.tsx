"use client";

import { Arrow, Content, Portal, Root, Trigger } from "@radix-ui/react-tooltip";
import clsx from "clsx";
import React from "react";

import Spacer from "~/components/Spacer";
import { forwardRef } from "~/utils/forwardRef";

import styles from "./Tooltip.module.scss";
import { TooltipProps } from "./Tooltip.props";

export { TooltipProvider } from "@radix-ui/react-tooltip";

const Tooltip = forwardRef<TooltipProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    rightSlot,
    children,
    className,
    content,
    slot_props,
    ...rest
  } = props;

  return (
    <Root {...rest}>
      <Trigger {...slot_props?.trigger} asChild>
        {children}
      </Trigger>
      <Portal {...slot_props?.portal}>
        <Content
          sideOffset={5}
          {...slot_props?.content}
          asChild
          className={clsx("flex-center", styles.content, className)}
          ref={ref}
        >
          <Component>
            {content}
            {rightSlot && (
              <React.Fragment>
                <Spacer />
                <span
                  {...slot_props?.rightSlot}
                  className={clsx(
                    "t-muted",
                    styles.x,
                    styles["right-slot"],
                    slot_props?.rightSlot?.className
                  )}
                >
                  {rightSlot}
                </span>
              </React.Fragment>
            )}
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

Tooltip.displayName = "Tooltip";

export default Tooltip;
