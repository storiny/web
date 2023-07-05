import React from "react";

import { ColorState } from "../../types";

export interface UseHueSliderProps {
  /**
   * Slider ref
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * Color state
   */
  state: ColorState;
}
