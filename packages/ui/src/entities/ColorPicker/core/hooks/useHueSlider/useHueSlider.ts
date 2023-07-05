import React from "react";

import { HUE_MAX } from "../../color/constants";
import { useSlider } from "../useSlider";
import { UseHueSliderProps } from "./useHueSlider.props";

/**
 * Hook for hue slider
 * @param props
 */
export const useHueSlider = (
  props: UseHueSliderProps
): { sliderProps: React.HTMLAttributes<HTMLElement> } => {
  const { state, ref } = props;
  const { sliderProps } = useSlider({
    ref,
    direction: "horizontal",
    onChange: (x) => state.setH(x),
    onStep: (amount) => state.rotateH(amount),
    maxValue: HUE_MAX,
    ariaLabel: "Hue slider",
    ariaValueNow: state.color.h,
    ariaValueText: String(state.color.h)
  });

  return { sliderProps };
};
