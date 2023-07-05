import React from "react";

import { ColorState } from "../../types";

export interface UseAlphaSliderProps {
  /**
   * Slider ref
   */
  ref: React.RefObject<HTMLElement>;
  /**
   * Color state
   */
  state: ColorState;
}
