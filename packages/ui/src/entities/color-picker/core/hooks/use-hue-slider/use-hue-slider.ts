import React from "react";

import { HUE_MAX } from "../../color/constants";
import { use_slider } from "../use-slider";
import { UseHueSliderProps } from "./use-hue-slider.props";

/**
 * Hook for hue slider
 * @param props
 */
export const use_hue_slider = (
  props: UseHueSliderProps
): { slider_props: React.HTMLAttributes<HTMLElement> } => {
  const { state, ref } = props;
  return use_slider({
    ref,
    direction: "horizontal",
    on_change: (x) => state.set_h(x),
    on_step: (amount) => state.rotate_h(amount),
    max_value: HUE_MAX,
    aria_label: "Hue slider",
    aria_value_now: state.color.h,
    aria_value_text: String(state.color.h)
  });
};
