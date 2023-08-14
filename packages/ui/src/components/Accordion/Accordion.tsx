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
import { forwardRef } from "~/utils/forwardRef";

import buttonStyles from "../common/ButtonReset.module.scss";
import styles from "./Accordion.module.scss";
import {
  AccordionContentProps,
  AccordionHeaderProps,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps
} from "./Accordion.props";

const Accordion = forwardRef<AccordionProps, "div">((props, ref) => {
  const { as: Component = "div", children, type, ...restProps } = props;
  const singleProps = restProps as Omit<
    AccordionSingleProps,
    "type" | "className" | "children"
  >;
  const multipleProps = restProps as Omit<
    AccordionMultipleProps,
    "type" | "className" | "children"
  >;

  return (
    <AccordionPrimitive
      {...(type === "multiple"
        ? {
            type: "multiple",
            ...multipleProps
          }
        : {
            type: "single",
            ...singleProps
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

const AccordionItem = forwardRef<AccordionItemProps, "div">(
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

const AccordionHeader = forwardRef<AccordionHeaderProps, "h3">(
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

const AccordionTrigger = forwardRef<AccordionTriggerProps, "div">(
  (
    { as: Component = "button", className, children, slotProps, ...rest },
    ref
  ) => (
    <AccordionHeader {...slotProps?.header}>
      <AccordionTriggerPrimitive
        {...rest}
        asChild
        className={clsx(
          "focusable",
          "focus-invert",
          "flex",
          "f-grow",
          "t-medium",
          buttonStyles.reset,
          styles.trigger,
          className
        )}
        ref={ref}
      >
        <Component>
          {children}
          <ChevronIcon
            {...slotProps?.icon}
            className={clsx(styles.icon, slotProps?.icon?.className)}
          />
        </Component>
      </AccordionTriggerPrimitive>
    </AccordionHeader>
  )
);

AccordionTrigger.displayName = "AccordionTrigger";

// Content

const AccordionContent = forwardRef<AccordionContentProps, "div">(
  ({ as: Component = "div", className, children, slotProps, ...rest }, ref) => (
    <AccordionContentPrimitive
      {...rest}
      asChild
      className={clsx(styles.content, className)}
      ref={ref}
    >
      <Component>
        <div
          {...slotProps?.wrapper}
          className={clsx(
            styles["content-wrapper"],
            slotProps?.wrapper?.className
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
