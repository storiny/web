"use client";

import {
  Corner as CornerPrimitive,
  Root as RootPrimitive,
  Scrollbar as ScrollbarPrimitive,
  Thumb as ThumbPrimitive,
  Viewport as ViewportPrimitive
} from "@radix-ui/react-scroll-area";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./ScrollArea.module.scss";
import { ScrollAreaProps } from "./ScrollArea.props";

// Root

const Root = React.forwardRef<
  HTMLDivElement,
  Omit<ScrollAreaProps, "as" | "enableHorizontal" | "slot_props">
>(({ children, className, size = "md", ...rest }, ref) => (
  <RootPrimitive
    {...rest}
    className={clsx(styles["scroll-area"], styles[size], className)}
    ref={ref}
  >
    {children}
  </RootPrimitive>
));

Root.displayName = "Root";

// Viewport

const Viewport = React.forwardRef<
  HTMLDivElement,
  NonNullable<NonNullable<ScrollAreaProps["slot_props"]>["viewport"]>
>(({ className, children, ...rest }, ref) => (
  <ViewportPrimitive
    {...rest}
    className={clsx(styles.viewport, className)}
    ref={ref}
  >
    {children}
  </ViewportPrimitive>
));

Viewport.displayName = "Viewport";

// Thumb

const Thumb = ({
  className,
  ...rest
}: NonNullable<
  NonNullable<ScrollAreaProps["slot_props"]>["thumb"]
>): React.ReactElement => (
  <ThumbPrimitive {...rest} className={clsx(styles.thumb, className)} />
);

// Corner

const Corner = ({
  className,
  ...rest
}: NonNullable<
  NonNullable<ScrollAreaProps["slot_props"]>["corner"]
>): React.ReactElement => (
  <CornerPrimitive {...rest} className={clsx(styles.corner, className)} />
);

// Scrollbar

const Scrollbar = ({
  className,
  children,
  ...rest
}: NonNullable<
  NonNullable<ScrollAreaProps["slot_props"]>["scrollbar"]
>): React.ReactElement => (
  <ScrollbarPrimitive {...rest} className={clsx(styles.scrollbar, className)}>
    {children}
  </ScrollbarPrimitive>
);

const ScrollArea = forwardRef<ScrollAreaProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    enableHorizontal,
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
        {enableHorizontal && (
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
