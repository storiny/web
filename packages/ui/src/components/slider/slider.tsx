"use client";

import { Range, Root, Thumb, Track } from "@radix-ui/react-slider";
import clsx from "clsx";
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
    <Root
      {...rest}
      asChild
      className={clsx(styles.slider, className)}
      orientation={orientation}
      ref={ref}
    >
      <Component>
        <Track
          {...slot_props?.track}
          className={clsx(styles.track, slot_props?.track?.className)}
        >
          <Range
            {...slot_props?.range}
            className={clsx(styles.range, slot_props?.range?.className)}
          />
        </Track>
        <Thumb
          {...slot_props?.thumb}
          className={clsx(styles.thumb, slot_props?.thumb?.className)}
        />
      </Component>
    </Root>
  );
});

Slider.displayName = "Slider";

export default Slider;
