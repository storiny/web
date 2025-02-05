"use client";

import clsx from "clsx";
import { Slider as SliderPrimitive } from "radix-ui";
import React from "react";

import { forward_ref } from "~/utils/forward-ref";

import styles from "./slider.module.scss";
import { SliderProps } from "./slider.props";

const Slider = forward_ref<SliderProps, "span">((props, ref) => {
  const {
    as: Component = "span",
    className,
    orientation = "horizontal",
    slot_props,
    ...rest
  } = props;

  return (
    <SliderPrimitive.Root
      {...rest}
      asChild
      className={clsx(styles.slider, className)}
      orientation={orientation}
      ref={ref}
    >
      <Component>
        <SliderPrimitive.Track
          {...slot_props?.track}
          className={clsx(styles.track, slot_props?.track?.className)}
        >
          <SliderPrimitive.Range
            {...slot_props?.range}
            className={clsx(styles.range, slot_props?.range?.className)}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          {...slot_props?.thumb}
          className={clsx(styles.thumb, slot_props?.thumb?.className)}
        />
      </Component>
    </SliderPrimitive.Root>
  );
});

Slider.displayName = "Slider";

export default Slider;
