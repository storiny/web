import React from "react";

import { ColorState } from "../../types";

export interface HueSliderProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Color state
   */
  state: ColorState;
}
