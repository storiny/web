import React from "react";

import { BareLayer } from "../../../types";

export interface LayerProps extends React.ComponentPropsWithRef<"li"> {
  /**
   * Props passed to the dragger layer
   */
  draggerProps?: Omit<React.ComponentPropsWithRef<"button">, "color" | "size">;
  /**
   * Layer object
   */
  layer: BareLayer;
}
