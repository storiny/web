"use client";

import clsx from "clsx";
import React from "react";

import { use_alpha_slider } from "../../hooks";
import common_styles from "../common.module.scss";
import styles from "../slider.module.scss";
import { AlphaSliderProps } from "./alpha-slider.props";

const ALPHA_MAX = 100;

const AlphaSlider = React.memo(
  (props: AlphaSliderProps) => {
    const { state, className, ...rest } = props;
    const ref = React.useRef<HTMLDivElement>(null);
    const { slider_props } = use_alpha_slider({ ref, state });

    return (
      <div
        {...rest}
        {...slider_props}
        className={clsx(
          "focusable",
          styles.container,
          common_styles["transparent-grid"],
          className
        )}
        ref={ref}
        tabIndex={0}
      >
        <span
          className={clsx(common_styles.overlay, styles.overlay)}
          style={{
            backgroundImage: `linear-gradient(to right, transparent, #${state.color.hex})`
          }}
        />
        <span
          className={clsx(common_styles.thumb, styles.thumb)}
          data-testid={"alpha-thumb"}
          style={
            {
              "--color": state.color.str,
              left: `${(100 * state.color.a) / ALPHA_MAX}%`
            } as React.CSSProperties
          }
        />
      </div>
    );
  },
  (prev_props, next_props) =>
    prev_props.state.color.hex === next_props.state.color.hex &&
    prev_props.state.color.str === next_props.state.color.str &&
    prev_props.state.color.a === next_props.state.color.a
);

AlphaSlider.displayName = "AlphaSlider";

export default AlphaSlider;
