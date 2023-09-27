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

import { useMediaQuery } from "~/hooks/useMediaQuery";
import ChevronIcon from "~/icons/Chevron";
import { breakpoints } from "~/theme/breakpoints";
import { forwardRef } from "~/utils/forwardRef";

import { InputContext } from "../Input";
import styles from "./Select.module.scss";
import { SelectProps } from "./Select.props";

const Select = forwardRef<SelectProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    size: sizeProp = "md",
    color = "inverted",
    autoSize,
    renderTrigger = (trigger): React.ReactNode => trigger,
    valueChildren,
    disabled,
    children,
    slot_props,
    ...rest
  } = props;
  const {
    color: inputColor,
    size: inputSize,
    disabled: inputDisabled
  } = React.useContext(InputContext) || {}; // Size when the select is rendered as the `endDecorator` of an `Input` component
  const isSmallerThanTablet = useMediaQuery(breakpoints.down("tablet"));
  const size = autoSize ? (isSmallerThanTablet ? "lg" : sizeProp) : sizeProp;

  return (
    <Root {...rest} disabled={inputDisabled || disabled}>
      {renderTrigger(
        <Trigger
          {...slot_props?.trigger}
          className={clsx(
            "focusable",
            "flex-center",
            styles.trigger,
            styles[inputSize || size],
            styles[inputColor || color],
            // Check if inside context provider
            Boolean(inputSize) && styles.context,
            slot_props?.trigger?.className
          )}
          disabled={disabled}
        >
          <Value {...slot_props?.value} data-value>
            {valueChildren}
          </Value>
          <Icon
            {...slot_props?.icon}
            className={clsx(styles.icon, slot_props?.icon?.className)}
          >
            <ChevronIcon style={{ transform: "rotate(180deg)" }} />
          </Icon>
        </Trigger>
      )}
      <Portal {...slot_props?.portal}>
        <Content
          {...slot_props?.content}
          asChild
          className={clsx(
            styles.content,
            styles[inputSize || size],
            slot_props?.content?.className
          )}
          ref={ref}
        >
          <Component>
            <ScrollUpButton
              {...slot_props?.scrollUpButton}
              className={clsx(
                "flex-center",
                styles["scroll-button"],
                slot_props?.scrollUpButton?.className
              )}
            >
              <ChevronIcon />
            </ScrollUpButton>
            <Viewport
              {...slot_props?.viewport}
              className={clsx(styles.viewport, slot_props?.viewport?.className)}
            >
              {children}
            </Viewport>
            <ScrollDownButton
              {...slot_props?.scrollDownButton}
              className={clsx(
                "flex-center",
                styles["scroll-button"],
                slot_props?.scrollDownButton?.className
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
