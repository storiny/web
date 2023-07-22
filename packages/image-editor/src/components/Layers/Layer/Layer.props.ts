import React from "react";

import { Layer } from "../../../types";

export interface LayerProps extends React.ComponentPropsWithRef<"li"> {
  /**
   * Props passed to the dragger layer
   */
  draggerProps?: Omit<React.ComponentPropsWithRef<"button">, "color" | "size">;
  /**
   * Layer object
   */
  layer: Layer;
}
