"use client";

import clsx from "clsx";
import React from "react";

import css from "~/theme/main.module.scss";

import { use_hue_slider } from "../../hooks";
import common_styles from "../common.module.scss";
import styles from "../slider.module.scss";
import { HueSliderProps } from "./hue-slider.props";

const HUE_MAX = 359;
const HUE_STYLE = {
  background: `linear-gradient(${[
    "to left",
    "red 0",
    "#f09 10%",
    "#cd00ff 20%",
    "#3200ff 30%",
    "#06f 40%",
    "#00fffd 50%",
    "#0f6 60%",
    "#35ff00 70%",
    "#cdff00 80%",
    "#f90 90%",
    "red 100%"
  ].join(",")})`
};

const HueSlider = React.memo((props: HueSliderProps) => {
  const { state, className, style, ...rest } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const { slider_props } = use_hue_slider({ ref, state });

  return (
    <div
      {...rest}
      {...slider_props}
      className={clsx(css["focusable"], styles.container, className)}
      ref={ref}
      style={{ ...style, ...HUE_STYLE }}
      tabIndex={0}
    >
      <span
        className={clsx(common_styles.thumb, styles.thumb)}
        data-testid={"hue-thumb"}
        style={
          {
            "--color": state.get_solid_color(),
            left: `${(100 * state.color.h) / HUE_MAX}%`
          } as React.CSSProperties
        }
      />
    </div>
  );
});

HueSlider.displayName = "HueSlider";

export default HueSlider;
