import React from "react";

import { ALPHA_MAX } from "../../color/constants";
import { useSlider } from "../useSlider";
import { UseAlphaSliderProps } from "./useAlphaSlider.props";

/**
 * Hook for alpha slider
 * @param props
 */
export const useAlphaSlider = (
  props: UseAlphaSliderProps
): { sliderProps: React.HTMLAttributes<HTMLElement> } => {
  const { state, ref } = props;
  const { sliderProps } = useSlider({
    ref,
    direction: "horizontal",
    onChange: (x) => state.setA(x),
    onStep: (amount) => state.rotateA(amount),
    maxValue: ALPHA_MAX,
    ariaLabel: "Alpha slider",
    ariaValueNow: state.color.a,
    ariaValueText: String(state.color.a)
  });

  return { sliderProps };
};
