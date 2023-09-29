import React from "react";

import { ColorState } from "../../types";

export interface AlphaSliderProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Color state
   */
  state: ColorState;
}
