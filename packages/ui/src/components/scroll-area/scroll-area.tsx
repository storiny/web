"use client";

import clsx from "clsx";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./scroll-area.module.scss";
import { ScrollAreaProps } from "./scroll-area.props";

// Root

const Root = React.forwardRef<
  HTMLDivElement,
  Omit<ScrollAreaProps, "as" | "enable_horizontal" | "slot_props">
>(({ children, className, size = "md", ...rest }, ref) => (
  <ScrollAreaPrimitive.Root
    {...rest}
    className={clsx(styles["scroll-area"], styles[size], className)}
    ref={ref}
  >
    {children}
  </ScrollAreaPrimitive.Root>
));

Root.displayName = "Root";

// Viewport

const Viewport = React.forwardRef<
  HTMLDivElement,
  NonNullable<NonNullable<ScrollAreaProps["slot_props"]>["viewport"]>
>(({ className, children, ...rest }, ref) => (
  <ScrollAreaPrimitive.Viewport
    {...rest}
    className={clsx(styles.viewport, className)}
    ref={ref}
  >
    {children}
  </ScrollAreaPrimitive.Viewport>
));

Viewport.displayName = "Viewport";

// Thumb

const Thumb = ({
  className,
  ...rest
}: NonNullable<
  NonNullable<ScrollAreaProps["slot_props"]>["thumb"]
>): React.ReactElement => (
  <ScrollAreaPrimitive.Thumb
    {...rest}
    className={clsx(styles.thumb, className)}
  />
);

// Corner

const Corner = ({
  className,
  ...rest
}: NonNullable<
  NonNullable<ScrollAreaProps["slot_props"]>["corner"]
>): React.ReactElement => (
  <ScrollAreaPrimitive.Corner
    {...rest}
    className={clsx(styles.corner, className)}
  />
);

// Scrollbar

const Scrollbar = ({
  className,
  children,
  ...rest
}: NonNullable<
  NonNullable<ScrollAreaProps["slot_props"]>["scrollbar"]
>): React.ReactElement => (
  <ScrollAreaPrimitive.Scrollbar
    {...rest}
    className={clsx(styles.scrollbar, className)}
  >
    {children}
  </ScrollAreaPrimitive.Scrollbar>
);

const ScrollArea = forward_ref<ScrollAreaProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    enable_horizontal,
    className,
    children,
    slot_props,
    ...rest
  } = props;

  return (
    <Root {...rest} asChild className={className} ref={ref}>
      <Component>
        <Viewport
          {...slot_props?.viewport}
          className={slot_props?.viewport?.className}
        >
          {children}
        </Viewport>
        <Scrollbar
          {...slot_props?.scrollbar}
          className={slot_props?.scrollbar?.className}
          orientation="vertical"
        >
          <Thumb
            {...slot_props?.thumb}
            className={slot_props?.thumb?.className}
          />
        </Scrollbar>
        {enable_horizontal && (
          <>
            <Scrollbar
              {...slot_props?.scrollbar}
              className={slot_props?.scrollbar?.className}
              orientation="horizontal"
            >
              <Thumb
                {...slot_props?.thumb}
                className={slot_props?.thumb?.className}
              />
            </Scrollbar>
            <Corner
              {...slot_props?.corner}
              className={slot_props?.corner?.className}
            />
          </>
        )}
      </Component>
    </Root>
  );
});

ScrollArea.displayName = "ScrollArea";

export { Corner, Root, Scrollbar, Thumb, Viewport };
export default ScrollArea;
