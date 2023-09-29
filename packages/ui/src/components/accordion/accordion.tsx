"use client";

import {
  Accordion as AccordionPrimitive,
  AccordionContent as AccordionContentPrimitive,
  AccordionHeader as AccordionHeaderPrimitive,
  AccordionItem as AccordionItemPrimitive,
  AccordionMultipleProps,
  AccordionSingleProps,
  AccordionTrigger as AccordionTriggerPrimitive
} from "@radix-ui/react-accordion";
import clsx from "clsx";
import React from "react";

import ChevronIcon from "~/icons/Chevron";
import { forward_ref } from "src/utils/forward-ref";

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
    AccordionSingleProps,
    "type" | "className" | "children"
  >;
  const multiple_props = rest_props as Omit<
    AccordionMultipleProps,
    "type" | "className" | "children"
  >;

  return (
    <AccordionPrimitive
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
    </AccordionPrimitive>
  );
});

Accordion.displayName = "Accordion";

// Item

const AccordionItem = forward_ref<AccordionItemProps, "div">(
  ({ as: Component = "div", children, className, ...rest }, ref) => (
    <AccordionItemPrimitive
      {...rest}
      asChild
      className={clsx(styles.item, className)}
      data-item
      ref={ref}
    >
      <Component>{children}</Component>
    </AccordionItemPrimitive>
  )
);

AccordionItem.displayName = "AccordionItem";

// Header

const AccordionHeader = forward_ref<AccordionHeaderProps, "h3">(
  ({ as: Component = "h3", className, children, ...rest }, ref) => (
    <AccordionHeaderPrimitive
      {...rest}
      asChild
      className={clsx("flex", className)}
      ref={ref}
    >
      <Component>{children}</Component>
    </AccordionHeaderPrimitive>
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
      <AccordionTriggerPrimitive
        {...rest}
        asChild
        className={clsx(
          "focusable",
          "focus-invert",
          "flex",
          "f-grow",
          "t-medium",
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
      </AccordionTriggerPrimitive>
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
    <AccordionContentPrimitive
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
    </AccordionContentPrimitive>
  )
);

AccordionContent.displayName = "AccordionContent";

export { AccordionContent, AccordionItem, AccordionTrigger };
export default Accordion;
