"use client";

import { Arrow, Content, Portal, Root, Trigger } from "@radix-ui/react-tooltip";
import clsx from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import styles from "./tooltip.module.scss";
import { TooltipProps } from "./tooltip.props";

export { TooltipProvider } from "@radix-ui/react-tooltip";

const Tooltip = forward_ref<TooltipProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    right_slot,
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
          className={clsx(css["flex-center"], styles.content, className)}
          ref={ref}
        >
          <Component>
            {content}
            {right_slot && (
              <React.Fragment>
                <Spacer />
                <span
                  {...slot_props?.right_slot}
                  className={clsx(
                    css["t-muted"],
                    styles["right-slot"],
                    slot_props?.right_slot?.className
                  )}
                >
                  {right_slot}
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
