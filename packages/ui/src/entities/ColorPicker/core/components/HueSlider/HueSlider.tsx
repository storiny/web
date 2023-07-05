import clsx from "clsx";
import React from "react";

import { useHueSlider } from "../../hooks";
import commonStyles from "../common.module.scss";
import styles from "../slider.module.scss";
import { HueSliderProps } from "./HueSlider.props";

const HUE_MAX = 359;

const hueStyle = {
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
  const { sliderProps } = useHueSlider({ ref, state });

  return (
    <div
      {...rest}
      {...sliderProps}
      className={clsx("focusable", styles.container, className)}
      ref={ref}
      style={{ ...style, ...hueStyle }}
      tabIndex={0}
    >
      <span
        className={clsx(commonStyles.thumb, styles.thumb)}
        style={
          {
            "--color": state.getSolidColor(),
            left: `${(100 * state.color.h) / HUE_MAX}%`
          } as React.CSSProperties
        }
      />
    </div>
  );
});

HueSlider.displayName = "HueSlider";

export default HueSlider;
