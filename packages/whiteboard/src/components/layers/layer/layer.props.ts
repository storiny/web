import { FabricObject } from "fabric";
import React from "react";

export interface LayerProps extends React.ComponentPropsWithRef<"li"> {
  /**
   * Props passed to the dragger layer
   */
  dragger_props?: Omit<React.ComponentPropsWithRef<"button">, "color" | "size">;
  /**
   * Layer object
   */
  layer: FabricObject;
}
