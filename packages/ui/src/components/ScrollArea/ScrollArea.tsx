"use client";

import {
  Corner,
  Root,
  Scrollbar,
  Thumb,
  Viewport
} from "@radix-ui/react-scroll-area";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./ScrollArea.module.scss";
import { ScrollAreaProps } from "./ScrollArea.props";

const ScrollArea = forwardRef<ScrollAreaProps, "div">((props, ref) => {
  const {
    as: Component = "div",
    enableHorizontal,
    size = "md",
    className,
    children,
    slotProps,
    ...rest
  } = props;

  return (
    <Root
      {...rest}
      asChild
      className={clsx(styles["scroll-area"], styles[size], className)}
      ref={ref}
    >
      <Component>
        <Viewport
          {...slotProps?.viewport}
          className={clsx(styles.viewport, slotProps?.viewport?.className)}
        >
          {children}
        </Viewport>
        <Scrollbar
          {...slotProps?.scrollbar}
          className={clsx(styles.scrollbar, slotProps?.scrollbar?.className)}
          orientation="vertical"
        >
          <Thumb
            {...slotProps?.thumb}
            className={clsx(styles.thumb, slotProps?.thumb?.className)}
          />
        </Scrollbar>
        {enableHorizontal && (
          <>
            <Scrollbar
              {...slotProps?.scrollbar}
              className={clsx(
                styles.scrollbar,
                slotProps?.scrollbar?.className
              )}
              orientation="horizontal"
            >
              <Thumb
                {...slotProps?.thumb}
                className={clsx(styles.thumb, slotProps?.thumb?.className)}
              />
            </Scrollbar>
            <Corner
              {...slotProps?.corner}
              className={clsx(styles.corner, slotProps?.corner?.className)}
            />
          </>
        )}
      </Component>
    </Root>
  );
});

ScrollArea.displayName = "ScrollArea";

export default ScrollArea;
