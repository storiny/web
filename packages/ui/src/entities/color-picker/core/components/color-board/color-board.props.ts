import React from "react";

import { ColorState } from "../../types";

export interface ColorBoardProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * Color state
   */
  state: ColorState;
}
