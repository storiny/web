"use client";

import clsx from "clsx";
import { Accordion as AccordionPrimitive } from "radix-ui";
import React from "react";

import ChevronIcon from "~/icons/chevron";
import css from "~/theme/main.module.scss";
import { forward_ref } from "~/utils/forward-ref";

import button_styles from "../common/button-reset.module.scss";
import styles from "./accordion.module.scss";
import {
  AccordionContentProps,
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps
} from "./accordion.props";

const Accordion = forward_ref<AccordionProps, "div">((props, ref) => {
  const { as: Component = "div", children, type, ...rest_props } = props;
  const single_props = rest_props as Omit<
    AccordionPrimitive.AccordionSingleProps,
    "type" | "className" | "children"
  >;
  const multiple_props = rest_props as Omit<
    AccordionPrimitive.AccordionMultipleProps,
    "type" | "className" | "children"
  >;

  return (
    <AccordionPrimitive.Root
      {...(type === "multiple"
        ? {
            type: "multiple",
            ...multiple_props
          }
        : {
            type: "single",
            ...single_props
          })}
      asChild
      ref={ref}
    >
      <Component>{children}</Component>
    </AccordionPrimitive.Root>
  );
});

Accordion.displayName = "Accordion";

// Item

const AccordionItem = forward_ref<AccordionItemProps, "div">(
  ({ as: Component = "div", children, className, ...rest }, ref) => (
    <AccordionPrimitive.Item
      {...rest}
      asChild
      className={clsx(styles.item, className)}
      data-item
      ref={ref}
    >
      <Component>{children}</Component>
    </AccordionPrimitive.Item>
  )
);

AccordionItem.displayName = "AccordionItem";

// Header

const AccordionHeader = forward_ref<AccordionHeaderProps, "h3">(
  ({ as: Component = "h3", className, children, ...rest }, ref) => (
    <AccordionPrimitive.Header
      {...rest}
      asChild
      className={clsx(css["flex"], className)}
      ref={ref}
    >
      <Component>{children}</Component>
    </AccordionPrimitive.Header>
  )
);

AccordionHeader.displayName = "AccordionHeader";

// Trigger

const AccordionTrigger = forward_ref<AccordionTriggerProps, "div">(
  (
    { as: Component = "button", className, children, slot_props, ...rest },
    ref
  ) => (
    <AccordionHeader {...slot_props?.header}>
      <AccordionPrimitive.Trigger
        {...rest}
        asChild
        className={clsx(
          css["focusable"],
          css["focus-invert"],
          css["flex"],
          css["f-grow"],
          css["t-medium"],
          button_styles.reset,
          styles.trigger,
          className
        )}
        ref={ref}
      >
        <Component>
          {children}
          <ChevronIcon
            {...slot_props?.icon}
            className={clsx(styles.icon, slot_props?.icon?.className)}
          />
        </Component>
      </AccordionPrimitive.Trigger>
    </AccordionHeader>
  )
);

AccordionTrigger.displayName = "AccordionTrigger";

// Content

const AccordionContent = forward_ref<AccordionContentProps, "div">(
  (
    { as: Component = "div", className, children, slot_props, ...rest },
    ref
  ) => (
    <AccordionPrimitive.Content
      {...rest}
      asChild
      className={clsx(styles.content, className)}
      ref={ref}
    >
      <Component>
        <div
          {...slot_props?.wrapper}
          className={clsx(
            styles["content-wrapper"],
            slot_props?.wrapper?.className
          )}
        >
          {children}
        </div>
      </Component>
    </AccordionPrimitive.Content>
  )
);

AccordionContent.displayName = "AccordionContent";

export { AccordionContent, AccordionItem, AccordionTrigger };
export default Accordion;
