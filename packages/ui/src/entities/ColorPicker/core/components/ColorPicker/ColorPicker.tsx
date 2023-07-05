import clsx from "clsx";
import React from "react";

import { useColorState } from "../../hooks";
import AlphaSlider from "../AlphaSlider";
import ColorBoard from "../ColorBoard";
import HueSlider from "../HueSlider";
import Params from "../Params";
import styles from "./ColorPicker.module.scss";
import { ColorPickerProps } from "./ColorPicker.props";

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (props, ref) => {
    const state = useColorState(props);
    return (
      <div className={"flex-col"} ref={ref} role="group">
        <ColorBoard state={state} />
        <div className={clsx("flex-col", styles.controls)}>
          <div className={clsx("flex-col", styles.sliders)}>
            <HueSlider state={state} />
            <AlphaSlider state={state} />
          </div>
          <Params state={state} />
        </div>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
