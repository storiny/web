import React from "react";

import { ALPHA_MAX } from "../../color/constants";
import { use_slider } from "../use-slider";
import { UseAlphaSliderProps } from "./use-alpha-slider.props";

/**
 * Hook for alpha slider
 * @param props
 */
export const use_alpha_slider = (
  props: UseAlphaSliderProps
): { slider_props: React.HTMLAttributes<HTMLElement> } => {
  const { state, ref } = props;
  return use_slider({
    ref,
    direction: "horizontal",
    on_change: (x) => state.set_a(x),
    on_step: (amount) => state.rotate_a(amount),
    max_value: ALPHA_MAX,
    aria_label: "Alpha slider",
    aria_value_now: state.color.a,
    aria_value_text: String(state.color.a)
  });
};
