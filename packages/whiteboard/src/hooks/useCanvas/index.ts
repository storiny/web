import { Canvas } from "fabric";
import React from "react";

import { FabricContext } from "../../components/context";

/**
 * Hook for consuming canvas context
 */
export const useCanvas = (): React.MutableRefObject<Canvas> =>
  React.useContext(FabricContext);
