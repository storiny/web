"use client";

import clsx from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import { previewColorAtom } from "../../atoms";
import { useColorState } from "../../hooks";
import AlphaSlider from "../AlphaSlider";
import ColorBoard from "../ColorBoard";
import EyeDropper from "../EyeDropper";
import HueSlider from "../HueSlider";
import Params from "../Params";
import styles from "./ColorPicker.module.scss";
import { ColorPickerProps } from "./ColorPicker.props";

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (props, ref) => {
    const setPreviewColor = useSetAtom(previewColorAtom);
    const state = useColorState({
      ...props,
      onChange: (value) => {
        setPreviewColor(value.str);
        props?.onChange?.(value);
      }
    });

    return (
      <div className={"flex-col"} ref={ref} role="group">
        <ColorBoard state={state} />
        <div className={clsx("flex-col", styles.controls)}>
          <div
            className={clsx(
              "flex-center",
              "f-grow",
              styles["controls-wrapper"]
            )}
          >
            <EyeDropper state={state} />
            <div className={clsx("flex-col", "f-grow", styles.sliders)}>
              <HueSlider state={state} />
              <AlphaSlider state={state} />
            </div>
          </div>
          <Params state={state} />
        </div>
      </div>
    );
  }
);

ColorPicker.displayName = "ColorPicker";

export default ColorPicker;
