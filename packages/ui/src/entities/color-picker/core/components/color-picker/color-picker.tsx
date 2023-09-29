"use client";

import clsx from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import { preview_color_atom } from "../../atoms";
import { use_color_state } from "../../hooks";
import AlphaSlider from "../alpha-slider";
import ColorBoard from "../color-board";
import EyeDropper from "../eye-dropper";
import HueSlider from "../hue-slider";
import Params from "../params";
import styles from "./color-picker.module.scss";
import { ColorPickerProps } from "./color-picker.props";

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (props, ref) => {
    const set_preview_color = use_set_atom(preview_color_atom);
    const state = use_color_state({
      ...props,
      on_change: (value) => {
        set_preview_color(value.str);
        props?.on_change?.(value);
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
