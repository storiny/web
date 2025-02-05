"use client";

import clsx from "clsx";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import React from "react";

import Spacer from "~/components/spacer";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import styles from "./tooltip.module.scss";
import { TooltipProps } from "./tooltip.props";

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
    <TooltipPrimitive.Root {...rest}>
      <TooltipPrimitive.Trigger {...slot_props?.trigger} asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal {...slot_props?.portal}>
        <TooltipPrimitive.Content
          collisionPadding={12}
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
            <TooltipPrimitive.Arrow
              {...slot_props?.arrow}
              className={clsx(styles.arrow, slot_props?.arrow?.className)}
            />
          </Component>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
});

Tooltip.displayName = "Tooltip";

export const TooltipProvider = TooltipPrimitive.TooltipProvider;
export default Tooltip;
