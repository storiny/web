"use client";

import {
  Content,
  Icon,
  Portal,
  Root,
  ScrollDownButton,
  ScrollUpButton,
  Trigger,
  Value,
  Viewport
} from "@radix-ui/react-select";
import clsx from "clsx";
import React from "react";

import ChevronIcon from "~/icons/Chevron";
import { forwardRef } from "~/utils/forwardRef";

import { InputContext } from "../Input";
import styles from "./Select.module.scss";
import { SelectProps } from "./Select.props";

const Select = forwardRef<SelectProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size = "md",
    color = "inverted",
    renderTrigger = (trigger): React.ReactNode => trigger,
    disabled,
    children,
    slotProps,
    ...rest
  } = props;
  const {
    color: inputColor,
    size: inputSize,
    disabled: inputDisabled
  } = React.useContext(InputContext) || {};

  return (
    <Root {...rest} disabled={inputDisabled || disabled}>
      {renderTrigger(
        <Trigger
          {...slotProps?.trigger}
          className={clsx(
            "focusable",
            "flex-center",
            styles.trigger,
            styles[inputSize || size],
            styles[inputColor || color],
            // Check if inside context provider
            Boolean(inputSize) && styles.context,
            slotProps?.trigger?.className
          )}
        >
          <Value {...slotProps?.value} data-value />
          <Icon
            {...slotProps?.icon}
            className={clsx(styles.icon, slotProps?.icon?.className)}
          >
            <ChevronIcon style={{ transform: "rotate(180deg)" }} />
          </Icon>
        </Trigger>
      )}
      <Portal {...slotProps?.portal}>
        <Content
          {...slotProps?.content}
          asChild
          className={clsx(
            styles.content,
            styles[inputSize || size],
            slotProps?.content?.className
          )}
          ref={ref}
        >
          <Component>
            <ScrollUpButton
              {...slotProps?.scrollUpButton}
              className={clsx(
                "flex-center",
                styles["scroll-button"],
                slotProps?.scrollUpButton?.className
              )}
            >
              <ChevronIcon />
            </ScrollUpButton>
            <Viewport
              {...slotProps?.viewport}
              className={clsx(styles.viewport, slotProps?.viewport)}
            >
              {children}
            </Viewport>
            <ScrollDownButton
              {...slotProps?.scrollDownButton}
              className={clsx(
                "flex-center",
                styles["scroll-button"],
                slotProps?.scrollDownButton?.className
              )}
            >
              <ChevronIcon style={{ transform: "rotate(180deg)" }} />
            </ScrollDownButton>
          </Component>
        </Content>
      </Portal>
    </Root>
  );
});

Select.displayName = "Select";

export default Select;
