import clsx from "clsx";
import React from "react";

import { useAlphaSlider } from "../../hooks";
import commonStyles from "../common.module.scss";
import styles from "../slider.module.scss";
import { AlphaSliderProps } from "./AlphaSlider.props";

const ALPHA_MAX = 100;

const AlphaSlider = React.memo((props: AlphaSliderProps) => {
  const { state, className, ...rest } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const { sliderProps } = useAlphaSlider({ ref, state });

  return (
    <div
      {...rest}
      {...sliderProps}
      className={clsx(
        "focusable",
        styles.container,
        commonStyles.transBackground,
        className
      )}
      ref={ref}
      tabIndex={0}
    >
      <span
        className={clsx(commonStyles.overlay, styles.overlay)}
        style={{
          backgroundImage: `linear-gradient(to right, transparent, #${state.color.hex})`
        }}
      />
      <span
        className={clsx(commonStyles.thumb, styles.thumb)}
        style={
          {
            "--color": state.color.str,
            left: `${(100 * state.color.a) / ALPHA_MAX}%`
          } as React.CSSProperties
        }
      />
    </div>
  );
});

AlphaSlider.displayName = "AlphaSlider";

export default AlphaSlider;
