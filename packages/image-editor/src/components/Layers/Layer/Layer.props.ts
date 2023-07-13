import React from "react";

import { Layer } from "../../../constants";

export interface LayerProps extends React.ComponentPropsWithRef<"li"> {
  /**
   * Props passed to the dragger element
   */
  draggerProps?: Omit<React.ComponentPropsWithRef<"button">, "color" | "size">;
  /**
   * Layer object
   */
  layer: Layer;
}
