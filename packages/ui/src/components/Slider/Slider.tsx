"use client";

import { Range, Root, Thumb, Track } from "@radix-ui/react-slider";
import clsx from "clsx";
import React from "react";

import { forwardRef } from "~/utils/forwardRef";

import styles from "./Slider.module.scss";
import { SliderProps } from "./Slider.props";

const Slider = forwardRef<SliderProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    className,
    orientation = "horizontal",
    slotProps,
    ...rest
  } = props;

  return (
    <Root
      {...rest}
      asChild
      className={clsx(styles.slider, className)}
      orientation={orientation}
      ref={ref}
    >
      <Component>
        <Track
          {...slotProps?.track}
          className={clsx(styles.track, slotProps?.track?.className)}
        >
          <Range
            {...slotProps?.range}
            className={clsx(styles.range, slotProps?.range?.className)}
          />
        </Track>
        <Thumb
          {...slotProps?.thumb}
          className={clsx(styles.thumb, slotProps?.thumb?.className)}
        />
      </Component>
    </Root>
  );
});

Slider.displayName = "Slider";

export default Slider;
